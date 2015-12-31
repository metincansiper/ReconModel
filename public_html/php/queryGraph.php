<?php
ini_set('max_execution_time', 500);
//Biogene url
$url = "http://nashua.case.edu/PathCaseRECONService/PathwaysService.asmx?op=GetReconGraphData";

//Biogene query parameters
$modelID = urlencode($_POST["modelID"]);

// Query string
$queryDataArray = array("modelID" => $modelID);
//$url = $url . '?' . http_build_query($queryDataArray);
// Get JSON from BioGene
//$output = file_get_contents($url);
//$output = http_post_fields($url, $queryDataArray);
$xml_post_string = '<?xml version="1.0" encoding="utf-8"?>'
        . '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        . '<soap:Body>'
        . '<GetReconGraphData xmlns="http://nashua.cwru.edu/PathwaysService/">'
        . '<modelID>'
        . $modelID
        . '</modelID>'
        . '</GetReconGraphData>'
        . '</soap:Body>'
        . '</soap:Envelope>';

$headers = array(
    "POST /PathCaseRECONService/PathwaysService.asmx HTTP/1.1",
    "Host: nashua.case.edu",
    "Content-Type: text/xml; charset=utf-8",
    "Content-Length: " . strlen($xml_post_string)
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

