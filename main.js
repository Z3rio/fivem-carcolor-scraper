const requestPromise = require("request-promise");
const fileSystem = require("fs");
const cheerio = require("cheerio");
const inquirer = require("inquirer");

inquirer
  .prompt([
    {
      type: "list",
      name: "format",
      message: "Which format do you want to save the data as?",
      choices: ["JSON", "Lua", "Javascript"],
    },
  ])
  .then(async (answers) => {
    await requestPromise(
      "https://altv.stuyk.com/docs/articles/tables/vehicle-colors.html",
      (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const colors = $(".markdown-section table tbody tr");
          let saveText = "";
          let fileName = "";

          switch (answers.format) {
            case "JSON":
              saveText = "[";
              fileName = "data.json";
              break;
            case "Lua":
              saveText = "local colors = {";
              fileName = "data.lua";
              break;
            case "Javascript":
              saveText = "const colors = [";
              fileName = "data.js";
              break;
          }

          colors.each((idx, color) => {
            const values = $(color).find("td");

            switch (answers.format) {
              case "JSON":
                saveText += `
    {
        "id": ${$(values[0]).text()},
        "name": "${$(values[1]).text()}",
        "hex": "${$(values[4]).text()}",
        "rgb": [${$(values[3]).text()}]
    }`;
                break;
              case "Lua":
                saveText += `
    {
        ["id"] = ${$(values[0]).text()},
        ["name"] = "${$(values[1]).text()}",
        ["hex"] = "${$(values[4]).text()}",
        ["rgb"] = {${$(values[3]).text()}}
    }`;
                break;
              case "Javascript":
                saveText += `
    {
        id: ${$(values[0]).text()},
        name: "${$(values[1]).text()}",
        hex: "${$(values[4]).text()}",
        rgb: [${$(values[3]).text()}]
    }`;
                break;
            }

            if (idx !== colors.length - 1) {
              saveText += ",";
            }
          });

          switch (answers.format) {
            case "JSON":
              saveText += "\n]";
              break;
            case "Lua":
              saveText += "\n}";
              break;
            case "Javascript":
              saveText += "\n];";
              break;
          }

          fileSystem.writeFile(fileName, saveText, function (err) {
            if (err) return console.log(err);
          });
        }
      }
    );
  });
