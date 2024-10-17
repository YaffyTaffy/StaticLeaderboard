const baseUrl = "https://www.extra-life.org/api/";

// Function to convert a date to UTC format
function convertToUTCString(date) {
  return new Date(date).toISOString();
}

function saveLeaderboardData() {
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const Ids = document.getElementById("participantIds").value.split(',');

    if (startTime && endTime && Ids.length !=null) {
        console.log("yippee");
        console.log("start: " + startTime + " end: " + endTime + "ids: " + Ids);
        reloadLeaderboardStats(startTime, endTime, Ids);

    } 
    else {
        alert("Please fill out all fields correctly");
    }

}

// Function to get donation data for a participant and calculate the total amount raised
async function fetchParticipantDonations(participantId, startTime, endTime) {
  const donationsUrl = `${baseUrl}participants/${participantId}/donations`;
  try {
    const response = await fetch(donationsUrl);
    const data = await response.json();

    let totalRaised = 0;

    data.forEach(donation => {
      const donationTime = new Date(donation.createdDateUTC);
      if (donationTime > new Date(startTime) && donationTime < new Date(endTime)) {
        totalRaised += donation.amount;
      }
    });

    return totalRaised;
  } catch (error) {
    console.error(`Error fetching donations for participant ${participantId}:`, error);
    return 0; // If there's an error, return 0 donations
  }
}

// Function to fetch participant name
async function fetchParticipantData(participantId) {
  const participantUrl = `${baseUrl}participants/${participantId}`;
  try {
    const response = await fetch(participantUrl);
    const data = await response.json();
    return {
      name: data.displayName
    };
  } catch (error) {
    console.error(`Error fetching participant data for ${participantId}:`, error);
    return { name: "Unknown", goal: 0 }; // Default values if there's an error
  }
}

// Function to reload the leaderboard and update the table in HTML
async function reloadLeaderboardStats() {
  const participantIds = [531986, 540075, 540361, 537353, 532911, 
                          531613, 539916, 536837, 538348, 538351, 
                          538371, 533325, 530720];

  const startTimeUTC = convertToUTCString("2024-10-19T13:00");
  const endTimeUTC = convertToUTCString("2024-10-20T13:00");

  const leaderboardTable = document.getElementById("tableData");
  leaderboardTable.innerHTML = ""; // Clear the table before adding new data

  let participantsData = [];
  let totalOverallRaised = 0;

  // Fixed conversion rate from USD to CAD
  const exchangeRateUsdToCad = 1.38; // Example rate, adjust as needed

  // Fetch data for all participants
  for (let i = 0; i < participantIds.length; i++) {
    const participantId = participantIds[i];

    // Fetch participant name
    const { name } = await fetchParticipantData(participantId);

    // Fetch donation data and calculate total amount raised
    const totalRaisedUsd = await fetchParticipantDonations(participantId, startTimeUTC, endTimeUTC);

    // Convert the total raised amount from USD to CAD
    const totalRaisedCad = totalRaisedUsd * exchangeRateUsdToCad;

    participantsData.push({ name, totalRaised: totalRaisedCad });
    totalOverallRaised += totalRaisedCad;
  }

  // Sort participants by totalRaised in descending order
  participantsData.sort((a, b) => b.totalRaised - a.totalRaised);

  // Update the leaderboard table with sorted participants
  participantsData.forEach((participant, index) => {
    // Create a new row for the participant
    const row = document.createElement("tr");

    // Create cells for rank, name, and amount raised
    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;

    const nameCell = document.createElement("td");
    nameCell.textContent = participant.name;

    const raisedCell = document.createElement("td");
    raisedCell.textContent = `$${participant.totalRaised.toFixed(2)}`;

    // Append cells to the row
    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(raisedCell);

    // Append the row to the table body
    leaderboardTable.appendChild(row);
  });

  // Update the overall raised amount in the HTML
  const overallSumElement = document.querySelector(".overallSum p");
  overallSumElement.textContent = `$${totalOverallRaised.toFixed(2)}`;

  // Update the "Last Updated" time
  const now = new Date();
  const updateTimeElement = document.getElementById("updateTime");
  const formattedTime = now.toLocaleString(); // e.g., "10/16/2024, 11:52:31 AM"
  updateTimeElement.innerHTML = `<strong>Last Updated:</strong> ${formattedTime}`;
}

// Initialize and set interval for refreshing
document.addEventListener("DOMContentLoaded", function () {
  reloadLeaderboardStats();

  setInterval(function () {
    reloadLeaderboardStats();
    console.log("refresh");
  }, 30000); // 30 seconds
});
