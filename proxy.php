<?php
define('LANYRD_CALLS_URL', 'http://lanyrd.com/calls/');

$queryString = '';
if (!empty($_SERVER['QUERY_STRING'])) {
    $queryString = '?' . $_SERVER['QUERY_STRING'];
}

echo file_get_contents(LANYRD_CALLS_URL . $queryString);