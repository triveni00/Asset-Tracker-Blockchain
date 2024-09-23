var assetCount = 0;
let assetData = [];  // Array to store asset information

$(document).ready(() => {
  // Initialize Web3 and check for MetaMask
  if (typeof window.ethereum !== 'undefined') {
    window.web3 = new Web3(window.ethereum);
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        console.log("Connected account:", accounts[0]);
        web3.eth.defaultAccount = accounts[0];
        renderPageContent();  // Load content once account is connected
      })
      .catch(err => {
        console.error("User denied account access:", err);
        alert("Please connect your MetaMask wallet.");
      });
  } else {
    alert("Please install MetaMask or another Web3 provider.");
  }
});

function renderPageContent() {
  AssetTrackerContract.methods.getAssetCount().call((error, response) => {
    if (error) {
      console.log("Error fetching asset count:", error);
    } else {
      assetCount = response;
      $("#count").html("Total " + response + " Assets");
      renderTable();
    }
  });

  function renderTable() {
    assetData = [];  // Clear the array before fetching data

    for (let i = 1; i <= parseInt(assetCount); i++) {
      AssetTrackerContract.methods.getAsset(i).call((error, response) => {
        if (error) {
          console.log("Error fetching asset:", error);
        } else {
          // Store the asset details in the assetData array
          let asset = {
            id: i,
            batchNo: response[0],
            name: response[1],
            description: response[2],
            manufacturer: response[3],
            owner: response[4]
          };
          assetData.push(asset);

          let row =
            '<tr><th scope="row">' +
            i +
            "</th>" +
            "<td>" +
            response[0] +
            "</td>" +
            "<td>" +
            response[1] +
            "</td>" +
            "<td>" +
            response[2] +
            "</td>" +
            "<td>" +
            response[3] +
            "</td>" +
            "<td>" +
            response[4] +
            "</td></tr>";

          $("tbody").append(row);
        }
      });
    }
    $("#loading").hide();
    displayJSON(); // Display JSON data on the webpage
  }
}

function createNewAsset() {
  let batchNo = $('input[name="batchNo"]').val();
  let name = $('input[name="name"]').val();
  let desc = $('input[name="desc"]').val();
  let manufacturer = $('input[name="manufacturer"]').val();
  let owner = $('input[name="owner"]').val();
  let status = $('input[name="status"]').val();

  // Validate input values
  if (!batchNo || !name || !desc || !manufacturer || !owner || !status) {
    alert("Please fill in all fields.");
    return;
  }

  // Get the user's account
  web3.eth.getAccounts().then(accounts => {
    if (accounts.length === 0) {
      alert("No account found! Make sure MetaMask is connected.");
      return;
    }

    const defaultAccount = accounts[0];  // Use the first account from MetaMask

    // Send the asset creation transaction
    AssetTrackerContract.methods
      .createAsset(batchNo, name, desc, manufacturer, owner, status)
      .send({ from: defaultAccount })  // Specify the account making the transaction
      .then(result => {
        if (result.status === true) {
          alert("Success: Asset created");
          console.log("Transaction Result:", result);
          $("#loading").show();
          $("tbody").html("");

          // Render the table again
          renderPageContent();

          // Clear the form
          $('input[name="batchNo"]').val("");
          $('input[name="name"]').val("");
          $('input[name="desc"]').val("");
          $('input[name="manufacturer"]').val("");
          $('input[name="owner"]').val("");
          $('input[name="status"]').val("");

          // Optionally download JSON file after adding the asset
          downloadJSONFile(assetData);
        }
      })
      .catch(error => {
        console.error("Error creating asset:", error);
        alert("Error: Unable to create asset. See console for details.");
      });
  });

  $("#exampleModal").modal("hide");
}

$("#exampleModal").on("shown.bs.modal", e => {
  // Fill the modal form with fake data when modal is shown
  $('input[name="batchNo"]').val(faker.random.number().toString());
  $('input[name="name"]').val(faker.commerce.product());
  $('input[name="desc"]').val(faker.lorem.text());
  $('input[name="manufacturer"]').val(faker.company.companyName());
  $('input[name="owner"]').val(faker.company.companyName());
});

// Listen for events and reload the ledger after any event
AssetTrackerContract.events.AssetTransfer((error, result) => {
  if (error) console.log(error);
  else {
    $("#count").html("");
    $("tbody").html("");
    renderPageContent();
  }
});

// Function to download JSON file
function downloadJSONFile(data) {
  // Convert object to JSON string
  const jsonString = JSON.stringify(data, null, 2);

  // Create a blob from the JSON string
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a link element
  const a = document.createElement("a");

  // Create a URL for the blob and set it as the href attribute
  a.href = URL.createObjectURL(blob);

  // Set the download attribute (the name of the file)
  a.download = "assetData.json";

  // Append the link to the body
  document.body.appendChild(a);

  // Programmatically click the link to trigger the download
  a.click();

  // Remove the link after triggering the download
  document.body.removeChild(a);
}

// Function to display JSON data on the webpage
function displayJSON() {
  // Format the JSON data with indentation
  const jsonString = JSON.stringify(assetData, null, 2);

  // Update the pre tag with the JSON string
  $("#jsonData").text(jsonString);
}