<?php
	$FILE_NAME_WITHOUT_JSON = "2022-10-07_15-16-48";

	ini_set("memory_limit","5000M");
	$str = file_get_contents($FILE_NAME_WITHOUT_JSON . ".json");
	$str = mb_convert_encoding($str,"UTF-8","Windows-1252");
	echo "strlen: " . strlen($str);

	$json = json_decode($str);

	if (json_last_error()) {
		echo "<br />json error: " . json_last_error();
	} else {
		echo "<br>creating indented file";
		file_put_contents("INDENTED 2022-10-07_15-16-48.json", json_encode($json,JSON_PRETTY_PRINT));

		if (!is_dir($FILE_NAME_WITHOUT_JSON)) {
			mkdir($FILE_NAME_WITHOUT_JSON);
		}

		$listOfFiles = array();
		foreach($json->sources as $k => $v) {
			if (isset($v->type) && $v->type == "gregtech") {
				echo "<br>Found GT machines: " . count($v->machines);
				foreach($v->machines as $kk => $vv) {
					if (count($vv->recs) > 0) {
						echo "<br>Creating file: '" . $vv->n . "', (recipes: " . count($vv->recs) . ")";
						file_put_contents($FILE_NAME_WITHOUT_JSON . "/" . $vv->n . ".json", json_encode($vv));
						file_put_contents($FILE_NAME_WITHOUT_JSON . "/INDENTED " . $vv->n . ".json", json_encode($vv,JSON_PRETTY_PRINT));
						array_push($listOfFiles,$vv->n . ".json");
					}
				}
			}
		}

		file_put_contents("list of files.json",json_encode($listOfFiles,JSON_PRETTY_PRINT));
	}

?>

