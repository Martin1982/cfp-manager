/*global $:false, window:false */
$(document).ready(function(){
    "use strict";
/**********************************
 * @todo Stuff moveable to a field class
 *********************************/
    function getStoredFields() {
        return JSON.parse(window.localStorage.getItem('fields')) || [];
    }

    function setStoredFields(fields) {
        window.localStorage.setItem('fields', JSON.stringify(fields));
    }

    function findIndexByLabel(fields, label) {
        for (var i =0; i < fields.length; i++) {
            if (fields[i].label === label) {
                return i;
            }
        }
        return null;
    }

    function loadFields() {
        var fields = getStoredFields(),
            i, field;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            if (field.hasOwnProperty('label') && field.hasOwnProperty('value')) {
                renderField(field.label, field.value);
            }
        }
    }

    function newField() {
        var label = window.prompt('Field name:'),
            value = window.prompt('Field value:'),
            storedFields = getStoredFields();

        storedFields.push({
            "label": label,
            "value": value
        });

        setStoredFields(storedFields);
        renderField(label, value);
    }

    function renderField(label, value) {
        var field = '<div class="field well"><h4>' + label + '</h4><textarea class="copy-field">' + value + '</textarea><br><div class="btn-group"><button class="edit-field btn"><i class="icon-pencil"></i></button><button class="remove-field btn"><i class="icon-trash"></i></button></div></div>';
        $(field).appendTo('#copyables');
    }

    function copyField(e) {
        $(e.currentTarget).select();
    }

    function editField(e) {
        var field = $(e.currentTarget).parent().parent(),
            oldFieldLabel = field.find('h4').text(),
            oldFieldValue = field.find('textarea').text(),
            newFieldLabel = window.prompt('New label', oldFieldLabel),
            newFieldValue = window.prompt('New value', oldFieldValue),
            storedFields = getStoredFields(),
            replaceableIndex = findIndexByLabel(storedFields, oldFieldLabel);

        field.find('h4').text(newFieldLabel);
        field.find('textarea').text(newFieldValue);

        if (replaceableIndex !== null) {
            storedFields[replaceableIndex] = {
                "label": newFieldLabel,
                "value": newFieldValue
            };

            setStoredFields(storedFields);
        }
    }

    function removeField(e) {
        var field = $(e.currentTarget).parent().parent(),
            label = field.find('h4').text(),
            storedFields = getStoredFields(),
            deleteableIndex = findIndexByLabel(storedFields, label);

        if (deleteableIndex !== null) {
            field.remove();
            storedFields.splice(deleteableIndex, 1);
            setStoredFields(storedFields);
        }
    }

    loadFields();

    $('.add-field').on('click', newField);
    $('.copy-field').on('click', copyField);
    $('.edit-field').on('click', editField);
    $('.remove-field').on('click', removeField);
    $('textarea').autosize();

/**********************************
 * @todo Stuff moveable to a lists class
 *********************************/


    function getStoredLists() {
        return JSON.parse(window.localStorage.getItem('lists')) || [];
    }

    function setStoredLists(lists) {
        var curList = getStoredLists();
        window.localStorage.setItem('lists', JSON.stringify(lists));
        if (JSON.stringify(lists) !== JSON.stringify(curList)) {
            //window.location.reload();
        }
    }

    function loadLists() {
        var list = getStoredLists(),
            undecidedContainer = $('ul.undecided'),
            acceptedContainer = $('ul.accepted'),
            declinedContainer = $('ul.declined'),
            i, listItem, renderItem, renderContainer, closeDate;

        undecidedContainer.html('');
        acceptedContainer.html('');
        declinedContainer.html('');

        for (i = 0; i < list.length; i++) {
            listItem = list[i];
            renderItem = '<li><a href="#" data-url="' + listItem.callUrl + '">' + listItem.eventName + '</a></li>';

            closeDate = Date.parse(listItem.callClose);
            if (closeDate > Date.today()) {
                switch (listItem.status) {
                    case 'undecided':
                        renderContainer = undecidedContainer;
                        break;
                    case 'accepted':
                        renderContainer = acceptedContainer;
                        break;
                    case 'declined':
                        renderContainer = declinedContainer;
                        break;
                    default:
                        renderContainer = undecidedContainer;
                }

                $(renderItem).appendTo(renderContainer);
            }
        }
    }

    function syncLanyrdItem(data) {
        var currentList = getStoredLists(),
            itemUpdated = false,
            i, currentItem;

        for (i = 0; i < currentList.length; i++) {
            currentItem = currentList[i];
            if (currentItem.callUrl === data.callUrl) {
                data.status = currentItem.status;
                currentList[i] = data;
                itemUpdated = true;
            }
        }

        if (itemUpdated === false) {
           currentList.push(data);
        }

        setStoredLists(currentList);
    }

    function formatEventDate(dateString) {
        dateString = dateString.replace(' on ', '');
        dateString = dateString.replace(' in \n', '');
        return dateString;
    }

    function formatCallCloseDate(dateString) {
        return dateString.replace('Call closes on ', '');
    }

    function syncLanyrdPage(page) {
        $.ajax({
            url: 'proxy.php?page=' + page
        })
        .done(function(output) {
            var lanyrdList = $(output).find('.call-item.call-list-open');

            lanyrdList.each(function(){
                var data = {
                    callType: $(this).find('p strong a').text(),
                    callClose: formatCallCloseDate($(this).find('p:last').text()),
                    callUrl: $(this).find('p strong a').attr('href'),
                    eventName: $($(this).find('a')[1]).text(),
                    eventDate: formatEventDate($($(this).find('p:first').contents()[3]).text()),
                    eventCity: $($(this).find('a')[2]).text(),
                    eventCountry: $($(this).find('a')[3]).text(),
                    status: 'undecided'
                };

                if (data.callType === "Call for speakers") {
                    syncLanyrdItem(data);
                }
            });
        });
    }

    function syncLanyrd() {
        $.ajax({
            url: 'proxy.php'
        })
        .done(function(output) {
            var lanyrdPage = $(output),
                pages = lanyrdPage.find('.pagination > ol > li:last').text();

            for (var i = 0; i < pages; i++) {
                syncLanyrdPage(i);
            }
        });
    }

    function findItemByCallUrl (urlKey) {
        var list = getStoredLists(),
            i, listItem;

        for (i = 0; i < list.length; i++) {
            listItem = list[i];
            if (listItem.callUrl === urlKey) {
                return [
                    i,
                    listItem
                ];
            }
        }

        return [];
    }

    function showDetails(e) {
        var urlKey = $(e.currentTarget).attr('data-url'),
            item = findItemByCallUrl(urlKey),
            itemData = item[1];

        $('#myModalLabel').text(itemData.eventName);
        $('#myModalEventDate').text(itemData.eventDate);
        $('#myModalEventCity').text(itemData.eventCity);
        $('#myModalEventCountry').text(itemData.eventCountry);
        $('#myModalCfpLink').html('<a href="' + itemData.callUrl + '" target="_blank">' + itemData.callUrl + '</a>');
        $('#myModalCfpCloses').text(itemData.callClose);
        $('.modal-footer').attr('data-call-url', itemData.callUrl);

        $('#myModal').modal();
    }

    function setCallStatus (e) {
        var clickedBtn = $(e.currentTarget),
            callUrl = clickedBtn.parent().attr('data-call-url'),
            item = findItemByCallUrl(callUrl),
            storedList = getStoredLists();

        item[1].status = clickedBtn.attr('data-status');
        storedList[parseInt(item[0], 10)] = item[1];
        setStoredLists(storedList);
        window.location.reload();
    }


    loadLists();
    syncLanyrd();

    $('li a').on('click', showDetails);
    $('.modal-footer button').on('click', setCallStatus);

});