
var fs = require('fs');
var path = require('path');
var async = require('async');


module.exports = {
    buildHtmlPages: function (dir, extention, exclNamesArray, operationsObject) {
        fs.readdir(dir, processFiles.bind(null, dir, extention, exclNamesArray, operationsObject))
    }
}



function processFiles (dir, extention, exclNames, operationsObject, error, listOfFiles) {
    if (error) return error
    var filesList = filterFiles(listOfFiles, extention, exclNames);
    parseContent (dir, filesList, operationsObject)
}


function parseContent (dir, arrayOfFiles, operationsObject) {
    var filesContent = [];
    async.eachOf(arrayOfFiles, function (value, key, callback){
        fs.readFile(dir + value, 'utf8', (err, data) => {
            if (err) throw err
            if (operationsObject.parseFunction) {
                filesContent[key] = operationsObject.parseFunction(data);
            } else {
                filesContent[key] = data;
            }
            // console.log(filesContent[key]);
            callback();
        });
    }, function (err){
        if (err) throw err;
        processContent(filesContent, operationsObject)
        // console.log('all files processed with errors');
});
}

function processContent(filesContent, operationsObject) {
    if ('json' === operationsObject.type) {
        var wrapPost = "";
        filesContent = sortByDate(filesContent);
        filesContent.forEach(elem => wrapPost += operationsObject.compileFunction(elem));
        // output is the html for div.news__container
        wrapPost = "<section id='newsPlaceholder' class='loadedPosts'>" + wrapPost + "</section>"
        // console.log(wrapPost);
        fs.writeFile("./public/fusedHTML/newsPosts.html", wrapPost, function(err) {
            if (err) throw err
            console.log("file NewsPost updated");
        });
    }
    else if ('md' === operationsObject.type){
        var readMoreFile = "";
        filesContent.forEach(elem => {
            fileName = elem.split('$')[1]; // the filename is picked up by the comment-line in the .md
            // console.log(fileName);
            readMoreFile = operationsObject.compileFunction(elem)
            readMoreFile = '<!doctype html><html lang="en"><head>' +
                '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
                '<title>SOUP: Soiless culture Operations</title>' +
                '<link href="../stylesheets/sheetRay.css" rel="stylesheet">' +
                '</head><body><div class="readMoreContainer">' + readMoreFile + '</div></body></html>';
            fs.writeFile("./public/fusedHTML/" + fileName + ".html", readMoreFile, function(err) {
                if (err) throw err
                console.log("readMore updated");
            });
        })

    }
}


function filterFiles (listOfFiles, extention, exclNames) {
    // console.log(listOfFiles);
    listOfFiles = listOfFiles.filter(file => path.extname(file) == extention);
    listOfFiles = listOfFiles.filter(file => exclNames.every(elem => file.indexOf(elem) <= -1));
    return listOfFiles
}





// sort json posts by DATE
function sortByDate(filesArray) {
    filesArray.forEach(function(elem, index) {
        var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        var splitt = elem.date.split('');
        elem.numDate = {
            "day": parseInt(splitt.slice(0,2).join('')),
            "month": months.indexOf(splitt.slice(2,5).join('')) + 1,
            "year": parseInt(splitt.slice(-4).join(''))

        }
    });
    filesArray.sort(function(a,b){
        var listOfCriteria = ['year', 'month', 'day'];
        var index = 0;
        return comparisonWrapper(a.numDate,b.numDate,listOfCriteria, index)
    });
    return filesArray
}

function comparisonWrapper(a,b,listOfCriteria, index) {
    if (index < listOfCriteria.length) {
        return compareElements(a,b,listOfCriteria[index])
    }
    else {
        return 0
    }
    function compareElements (a, b, criterion) {
        if (a[criterion] > b[criterion]) return -1  // this is newest first (reverse sign for reverse order)
        if (a[criterion] < b[criterion]) return 1
        if (a[criterion] == b[criterion]) return comparisonWrapper(a, b, listOfCriteria, ++index)
    }
}