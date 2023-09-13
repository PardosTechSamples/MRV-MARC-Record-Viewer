function mrc_view(mrc) {
  var result = ["", "", ""]; // Initialize result with empty strings for ISBN, Author, and Title
  var directory_and_fields = mrc.substr(24);
  var mrc_elements = directory_and_fields.split("\x1E");
  var directory = mrc_elements[0];
  var how_many_fields = directory.length / 12;

  for (var i = 0; i < how_many_fields; i++) {
    var directory_entry = directory.substr(i * 12, 12);
    var field_tag = directory_entry.substr(0, 3);

    // Check if field_tag is 100, 020, or 245
    if (field_tag === "100" || field_tag === "020" || field_tag === "245") {
      var fieldContents = mrc_elements[i + 1].substr(2);

      // Remove instances of "a" from the fieldContents
      fieldContents = fieldContents.replace(/a/g, "");

      if (field_tag === "020") {
        // Remove non-numeric characters from the ISBN
        fieldContents = fieldContents.replace(/[^\d]/g, "");
        result[0] = fieldContents;
      } else if (field_tag === "100") {
        result[1] = fieldContents;
      } else if (field_tag === "245") {
        // Remove unwanted characters from the title (e.g., ï¿½)
        fieldContents = fieldContents.replace(/ï¿½/g, "'");
        fieldContents = fieldContents.replace(/¿½/g, "'");
        result[2] = fieldContents;
      }
    }
  }

  return result;
}






function reset_page () {
  var element = document.getElementById("records_list");
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  var element = document.getElementById("report");
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function view_marc() {
  reset_page();
  var marc_input = document.getElementById("mrc_input_file").files[0];

  if (marc_input) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var marc_records = e.target.result.split("\x1d");
      var marc_records_no = marc_records.length - 1;

      // REPORT
      var plural_s = "s";
      if (marc_records_no == 1) {
        plural_s = "";
      }
      var report_contents = document.createTextNode(marc_records_no + " record" + plural_s + " found.\n");
      var report_p = document.getElementById("report");
      report_p.appendChild(report_contents);

      // INDEX
      var index_contents = "";
      var index_step = 1;
      if (marc_records_no > 100) {
        index_step = 10;
      }
      if (marc_records_no > 1000) {
        index_step = 1000;
      }
      // INDEX_ENTRY
      for (var i = 0; i < marc_records_no; i = i + index_step) {
        var j = i + 1;
        index_contents += "<a href='#record" + j + "'>" + j + "</a> ";
      }
      var index_p = document.getElementById("index");
      index_p.innerHTML = index_contents;

      // RECORDS
      for (var i = 0; i < marc_records_no; i++) {
        var record_list_a = document.createElement("a");
        var j = i + 1;
        record_list_a.setAttribute("name", "record" + j);

        var record_list_li = document.createElement("li");
        record_list_li.appendChild(record_list_a);

        var recordData = mrc_view(marc_records[i]);

        // Display ISBN
        var isbn_p = document.createElement("p");
        isbn_p.appendChild(document.createTextNode("ISBN: " + recordData[0]));

        // Display Author
        var author_p = document.createElement("p");
        author_p.appendChild(document.createTextNode("Author: " +recordData[1]));

        // Display Title
        var title_p = document.createElement("p");
        title_p.appendChild(document.createTextNode("Title: "+recordData[2]));

        record_list_li.appendChild(isbn_p);
        record_list_li.appendChild(author_p);
        record_list_li.appendChild(title_p);

        records_ol = document.getElementById("records_list");
        records_ol.appendChild(record_list_li);
      }
    };

    reader.readAsText(marc_input);
  } else {
    alert("Please select a file to upload.");
  }
}


var marc_records=[];


function export_csv() {
  var marc_input = document.getElementById("mrc_input_file").files[0];

  if (marc_input) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var marc_records = e.target.result.split("\x1d");
      var csvContent = "DisplayISBN,DisplayAuthor,DisplayTitle\n"; // Initialize CSV content with headers

      for (var i = 0; i < marc_records.length; i++) {
        var recordData = mrc_view(marc_records[i]);
        var isbn = recordData[0] || ""; // Set to empty string if undefined
        var author = recordData[1] || ""; // Set to empty string if undefined
        var title = recordData[2] || ""; // Set to empty string if undefined

        // Ensure data doesn't contain commas or line breaks that could break CSV format
        isbn = isbn.replace(/,/g, "");
        author = author.replace(/,/g, "");
        title = title.replace(/,/g, "");

        // Add record data to the CSV content
        csvContent += isbn + "," + author + "," + title + "\n";
      }

      // Create a blob with the CSV content and create a download link
      var blob = new Blob([csvContent], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "exported_data.csv";
      a.click();

      // Clean up the URL object
      URL.revokeObjectURL(url);
    };

    reader.readAsText(marc_input);
  }
}
