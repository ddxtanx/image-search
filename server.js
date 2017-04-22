var express = require('express');
var https = require('https');
var mongo = require('mongodb').MongoClient;
var app = express();
function getImage(text, offset, res){
    var indexOffset = 10*offset-1;
    var options = {
        hostname: "api.cognitive.microsoft.com",
        port: 443,
        path: "/bing/v5.0/images/search?q="+text+"&count=10&offset=" + indexOffset,
        headers: {
            'Ocp-Apim-Subscription-Key': '4151c4dcaf1d4923aa927a7035df2443'
        }
    }
    console.log(options.hostname+options.path);
    https.get(options, function(response){
        var json = ""
        response.on('data', function(data){
            json+=data;
        });
        response.on('end', function(){
            var realJSON = JSON.parse(json);
            var data = realJSON.value;
            var images = [];
            for(var x = 0; x<data.length; x++){
                var imageName = data[x].name;
                var thumbUrl = data[x].thumbnailUrl;
                var imageUrl = data[x].contentUrl;
                var siteUrl = data[x].hostPageDisplayUrl;
                var jsonTemp = {
                    "url": imageUrl,
                    "snippet": imageName,
                    "thumbnail": thumbUrl,
                    "context":siteUrl
                }
                images.push(JSON.stringify(jsonTemp));
            }
            res.writeHead(200, {'Content-Type': 'text/json'});
            res.write("[");
            res.write(images.toString());
            res.end("]");
        });
    });
}

app.get('/api/imagesearch/*', function(req,res){
    var url = req.url.split("/api/imagesearch/")[1];
    var term = url.split("?offset=")[0];
    var offset = url.split("?offset=")[1];
    mongo.connect('mongodb://localhost:27017/searches', function(err, db){
        if(err) throw err;
        var latest = db.collection('latest');
        var now = new Date(Date.now());
        var data = {
            'term': term,
            'when': now.toString()
        };
        latest.insert(data, function(err, data){
            if(err) throw err;
            console.log(data);
        });
    });
    getImage(term, offset, res);
});
app.get('/api/latest/imagesearch/', function(req, res){
    mongo.connect('mongodb://localhost:27017/searches', function(err, db){
        if(err) throw err;
        var latest = db.collection('latest');
        latest.find({}, {
            term: 1,
            when: 1,
            _id: 0
            }).toArray(function(err, data){
                if(err) throw err;
                data = data.reverse().slice(0, 10);
                res.writeHead(200, {'Content-Type': 'text/json'});
                console.log(JSON.stringify(data));
                res.end(JSON.stringify(data));
        });
    });
});
app.listen(process.env.PORT || 8080);