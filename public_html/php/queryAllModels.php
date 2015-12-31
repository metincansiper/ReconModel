<?php
//Biogene url
$url = "http://nashua.case.edu/PathCaseRECONService/PathwaysService.asmx?op=GetAllModels";

$xml_post_string = '<?xml version="1.0" encoding="utf-8"?>'
        . '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        . '<soap:Body>'
        . '<GetAllModels xmlns="http://nashua.cwru.edu/PathwaysService/" />'
        . '</soap:Body>'
        . '</soap:Envelope>';

$headers = array(
    "POST /PathCaseRECONService/PathwaysService.asmx HTTP/1.1",
    "Host: nashua.case.edu",
    "Content-Type: text/xml; charset=utf-8",
    "Content-Length: " . strlen($xml_post_string),
    "SOAPAction: http://nashua.cwru.edu/PathwaysService/GetAllModels"
);


$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $xml_post_string);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$output = curl_exec($ch);

curl_close($ch);

echo $output;
?>

