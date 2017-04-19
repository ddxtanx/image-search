var express = require('express');
var http = require('http');
var app = express();
function getImage(text, offset){
    var options = {
        url: "https://api.cognitive.microsoft.com/",
        path: "bing/v5.0/images/search?q="+text
    }
}