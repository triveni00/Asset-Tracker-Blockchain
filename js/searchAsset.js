var assetCount = 0;

$(document).ready(() => {
  renderPageContent();  // Load all assets on page load
});

// Fetch and render all assets
function renderPageContent() {
  AssetTrackerContract.methods.getAssetCount().call((error, response) => {
    if (error) {
      console.log(error);
    } else {
      assetCount = response;
      $("#count").html("Total " + assetCount + " Assets");
      renderTable(assetCount);  // Render all assets
    }
  });
}

// Function to render all assets in the table
function renderTable(assetCount) {
  $("tbody").html("");  // Clear previous table rows
  for (let i = 1; i <= parseInt(assetCount); i++) {
    AssetTrackerContract.methods.getAsset(i).call((error, response) => {
      if (error) console.log(error);
      else {
        let row =
          '<tr><th scope="row">' + i + "</th>" +
          "<td>" + response[0] + "</td>" +  // Batch No
          "<td>" + response[1] + "</td>" +  // Name
          "<td>" + response[2] + "</td>" +  // Manufacturer
          "<td>" + response[3] + "</td>" +  // Owner
          "<td>" + response[4] + "</td></tr>";  // Status

        $("tbody").append(row);  // Append each asset as a table row
      }
    });
  }
  $("#loading").hide();  // Hide loading indicator
}

// Search for a specific asset by its ID
function searchAsset() {
  $("#loading").show();
  let id = parseInt($('input[name="id"]').val());

  // Validate input
  if (isNaN(id) || id <= 0 || id > assetCount) {  // Ensure ID is within valid range
    $("#loading").hide();
    $("#searchResult").html("<h3>Please enter a valid Asset ID.</h3>");
    return;
  }

  // Clear previous search results and hide status history
  $("#searchResult").html("");
  $("#statusHistory").hide();

  console.log("Searching for Asset ID:", id);  // Debugging

  // Fetch the specific asset from the smart contract
  AssetTrackerContract.methods.getAsset(id).call((error, response) => {
    $("#loading").hide();  // Hide loading after the response

    if (error) {
      console.log("Error fetching asset:", error);
      $("#searchResult").html("<h3>Error fetching asset. Check console for details.</h3>");
      return;
    }

    console.log("Response from contract:", response);  // Debugging

    // Check if the asset exists
    if (response[1] !== "") {  // Assuming response[1] is the asset name
      // Asset found
      let result =
        '<br><h2 style="color: #218f76;">Asset found</h2>' +
        "<strong>Name: </strong>" + response[1] + "<br>" +
        "<strong>Batch No: </strong>" + response[0] + "<br>" +
        "<strong>Manufacturer: </strong>" + response[2] + "<br>" +
        "<strong>Owner: </strong>" + response[3] + "<br>" +
        "<strong>Description: </strong>" + response[5] + "<br>" +
        "<strong>Current Status: </strong>" + response[4] + "<br>";

      $("#searchResult").append(result);  // Display the found asset
      $("#statusHistory").show();  // Show status history
      assetHistory(id);  // Fetch asset status history
    } else {
      // Asset not found
      $("#searchResult").html("<h3>Asset Not Found</h3>");
    }
  });
}

// Function to show asset status history
function assetHistory(id) {
  AssetTrackerContract.methods.AssetStore(id).call((error, response) => {
    if (error) console.log(error);
    else {
      let statusCount = parseInt(response[5]);
      $("#statusHistory").html("");  // Clear previous history
      for (let i = statusCount; i >= 1; i--) {
        AssetTrackerContract.methods.getStatus(id, i).call((error, response) => {
          if (error) console.log(error);
          else {
            let date = new Date(parseInt(response[0]) * 1000);
            let event =
              date + "<br>" +
              response[2] + "<br>" +
              response[1] + "<br>" +
              "<br>";
            $("#statusHistory").append(event);
          }
        });
      }
    }
  });
}
