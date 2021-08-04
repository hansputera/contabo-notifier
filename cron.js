const { default: axios } = require("axios");
const { exec } = require("child_process");
const config = require("./config");
const seconds = 30;

function postWebhook(payloads) {
    axios.post(config.webhook_url, payloads).catch(() => {});
}

setInterval(() => {
    console.log("\n\n");
    console.log("Running");
    exec("node index.js", (error, stdout, stderr) => {
        if (error) console.error(error);
        else if (stdout) {
            if (/posting/i.test(stdout)) {
                const type = config.webhook_type.toLowerCase();
                console.log("Post it to webhook");
                const feeds = JSON.parse(stdout.split(">>>>>>>>>>")[1]);
                if (type == "discord") postWebhook({
                    "username": "Contabo RSS Feed",
                    "content": "New Feed from contabo",
                    "avatar_url": "https://i.ibb.co/cx81mM8/social-default-logo.png",
                    "embeds": feeds.map(feed => ({
                        title: feed.title,
                        description: `Last update at: ${new Date(feed.last_update).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        })}`,
                        fields: feed.summaries.map(summary => ({ ...summary, inline: true }))
                    })),
                });
                else if (type == "telegram") postWebhook({
                    "chat_id": config.chat_id,
                    "text": `New feed from contabo:\n\n${feeds.map((feed, index) => `${index+1}. [${feed.title}](${feed.url}), last update: ${new Date(feed.last_update).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    })}\n${feed.summaries.map(summary => `**${summary.name}**: ${summary.value}`)}`).join("\n\n")}`,
                    "parse_mode": "Markdown"
                })
            }
        }
        else if (stderr) console.debug("STDERR:", stderr);
    });
}, seconds * 1000); // 1 seconds = 1000 ms.