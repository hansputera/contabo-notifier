const fs = require("fs");
const axios = require("axios").default;
const cheerio = require("cheerio");
const { exec } = require("child_process");

// https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
function comparer(array)
{
    return function(current)
    {
        return !array.filter((other) =>
        {
            return other.value == current.value && other.display == current.display
        }).length
    }
}

const results = [];

function do_it()
{
    try {
        const caches_data = JSON.parse(fs.readFileSync("data.json", { encoding: "utf8" }));
        if (!"filter" in caches_data) throw new Error("invalid data");
        const array_1 = results.filter(comparer(caches_data));
        const array_2 = caches_data.filter(comparer(results));

        const result = array_1.concat(array_2);
        if (result.length) {
            console.log("Posting new data>>>>>>>>>>" + JSON.stringify(result));
            fs.writeFileSync("data.json", JSON.stringify(results));
        } else {
            console.log("No news data found");
        }
    } catch {
        console.log("Invalid JSON");
        fs.writeFileSync("data.json", JSON.stringify([]));
        exec("node index.js", (_, stdout, __) => {
            console.log(stdout);
        });
    }
}

axios.get("https://contabo-status.com/rss.php", {
    maxRedirects: 5
}).then((response) => {
    const content = response.data;
    const $ = cheerio.load(content);

    const entries = $("feed entry");
    entries.each((index, element) => {
        const $el = $(element);
        const summaries_cache = [];
        const title = $el.find("title").text().trim();
        const url = $el.find("link").attr("href");
        const last_update = new Date($el.find("updated").text().trim());
        const category = $el.find("category").attr("term");

        const summaries = $el.find("summary div div");
        summaries.each((index_summary, element_summary) => {
            const $el_summary = $el.find(element_summary);

            const summary_type = $el_summary.find("b").text().trim();
            const summary_value = $el_summary.find("p").text().trim();
            summaries_cache[index_summary] = { name: summary_type, value: summary_value };
        });
        results[index] = { title, url, last_update, category, summaries: summaries_cache };
    });
    do_it();
}).catch(console.error);
