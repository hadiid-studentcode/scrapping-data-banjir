const axios = require("axios");
const cheerio = require("cheerio");
const XLSX = require("xlsx");

async function scrapeSites(keyword) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      keyword
    )}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const $ = cheerio.load(data);

    const results = [];

    $("div.g").each((index, element) => {
      if (index <= 2) {
        // Ambil 5 hasil teratas
        const title = $(element).find("h3").text();
        const link = $(element).find("a").attr("href");
        const snippetText = $(element).find(".VwiC3b").text();

        const date = extractDate(snippetText); // Ekstrak tanggal dari snippetText

        const containsPekanbaru =
          /pekanbaru|kota pekanbaru/i.test(title) ||
          /pekanbaru|kota pekanbaru/i.test(link) ||
          /pekanbaru|kota pekanbaru/i.test(snippetText);
        const containsBanjir =
          /banjir/i.test(title) || /banjir/i.test(snippetText);

        let status = "tidak banjir";
        if (containsPekanbaru && containsBanjir) {
          status = "banjir";
        }

        results.push({ date, link, snippetText, status });
      }
    });

    return results;
  } catch (error) {
    console.error("Error scraping:", error);
    return [];
  }
}

// Fungsi untuk mengekstrak tanggal dari snippetText
function extractDate(snippetText) {
  const dateRegex =
    /(0?[1-9]|[12][0-9]|3[01]) (Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember) (202[23])/i;
  let dateMatch = snippetText.match(dateRegex);
  let date = dateMatch
    ? `${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`
    : "No date found";
  return date;
}

async function saveToExcel(data,start,end) {



  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  XLSX.writeFile(workbook, `banjir_${start}_${end}_.xlsx`);
  console.log("Data saved to Excel.");
}

async function runScrape() {
  const start = "2023-06-01";
  const end = "2023-07-01";
  const startDate = new Date(start);
  const endDate = new Date(end);


  let currentDate = new Date(startDate);
  let allResults = [];

  while (currentDate <= endDate) {
    const formattedDate = `${currentDate.getDate()} ${getMonthName(
      currentDate.getMonth()
    )} ${currentDate.getFullYear()}`;
    const keyword = `banjir di kota pekanbaru ${formattedDate}`;

    console.log(`Scraping ${keyword}`);
    const results = await scrapeSites(keyword);
    allResults.push(...results);

    currentDate.setDate(currentDate.getDate() + 1); // Move to next day
  }

  await saveToExcel(allResults,start,end);
}

function getMonthName(monthIndex) {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[monthIndex];
}

runScrape().catch((err) => console.error(err));
