
const charts = [];
let csvData = {
    chart1: [],chart2: [],chart3: [],chart4: [],chart5: [],chart6: [],chart7: [],chart8: [],chart9: [], chart10: [],
    chart11: [],chart12: [],chart13: [],chart14: [],chart15: [],chart16: [],chart17: [],chart18: [],chart19: [],chart20: [],
    chart21: [], chart22: [], chart23: [], chart24: [], chart25: [], chart26: [], chart27: [], chart28: [], chart29: [], chart30: []
};

let socket;
let wifiNames = [];

function updateConnectionStatus(connected) {
    if (connected) {
        console.log('Connected to ESP8266');
        document.getElementById('status').textContent = 'Connected to Smart Meter';
        document.getElementById('statusDot').style.backgroundColor = 'green';
    } else {
        console.log('Not connected to ESP8266');
        document.getElementById('status').textContent = 'Not connected to Smart Meter';
        document.getElementById('statusDot').style.backgroundColor = 'red';
    }
}

function connectToESP8266() {
    socket = new WebSocket('ws://' + window.location.hostname + ':81/');

    socket.onopen = function(event) {
        updateConnectionStatus(true);
    };

    socket.onmessage = function(event) {
        let jsonString  = event.data;
        var cleanedJsonString = jsonString.replace(/\s/g, '');
        var jsonObject = JSON.parse(cleanedJsonString);
        wifiNames = jsonObject.SSIDs.split(',');
        let wifiStatus = jsonObject.wifistatus;
        let localIP = jsonObject.IP;
        console.log(wifiStatus, localIP);

        let sdata = jsonObject.data;
        const values = sdata.split(',').map(Number);
        updateGridData(sdata);
        checkStatus(sdata);
        values.forEach((value, index) => {
            if (index < charts.length) {
                const chart = charts[index];
                if (chart.data.labels.length > 50) { // Adjust this value based on how many data points you want to display at once
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                chart.data.labels.push('');
                chart.data.datasets[0].data.push(value);
                chart.update();
            }
        });
    };

    socket.onerror = function(event) {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };


    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
        updateConnectionStatus(false);
        // Optionally set up a reconnection attempt
        setTimeout(connectToESP8266, 3000);
    };
}


function downloadAllGraphsCSV() {
    // Assuming all charts have the same number of data points and labels
    if (charts.length === 0 || charts[0].data.labels.length === 0) {
        console.error('No data to download');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    let maxLength = Math.max(...Object.values(csvData).map(arr => arr.length));
    
    // Add header row - Time, Graph 1, Graph 2, ...
    let headerRow = "Time,";
    headerRow += charts.map((_, index) => `Graph ${index + 1}`).join(',');
    csvContent += headerRow + "\n";

    // Add data rows
    for (let i = 0; i < maxLength; i++) {
        let row = `${i},`; // Replace with actual timestamp or index if available
        Object.keys(csvData).forEach((key, index, array) => {
            row += csvData[key][i] !== undefined ? csvData[key][i] : "";
            if (index < array.length - 1) {
                row += ",";
            }
        });
        csvContent += row + "\n";
    }

    // Encode and create a link to download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all_graphs_data.csv");
    document.body.appendChild(link);

    // Trigger download and remove link
    link.click();
    document.body.removeChild(link);
}


function updateGraphDisplay(selectedGraphIndex) {
    charts.forEach((chart, index) => {
        chart.canvas.style.display = (index === selectedGraphIndex) ? 'block' : 'none';
    });
}


// function updateButtonColors(activeChannel, activeButtonIndex) {
//     for (let j = 1; j <= 10; j++) {
//         const button = document.getElementById(`${activeChannel}button${j}`);
//         if (j === activeButtonIndex) {
//             button.classList.add('button-active');
//         } else {
//             button.classList.remove('button-active');
//         }
//     }
// }

// Function to update grid data
function updateGridData(data) {
    const dataValues = data.split(',').map(value => parseFloat(value).toFixed(2));

    rowId1 = ['grid1-v', 'grid1-i', 'grid1-f', 'grid1-pf'];
    // Update grid 1
    rowId1.forEach((rows, index) => {
        gridRow = document.getElementById(rows).children;
        gridRow[1].textContent = dataValues[2 + index];
        gridRow[2].textContent = dataValues[6 + index];
        gridRow[3].textContent = dataValues[10 + index];
    });
    
    rowId2 = ['grid2-v', 'grid2-i', 'grid2-p', 'grid2-e', 'grid2-f', 'grid2-pf'];
    // Update grid 2
    rowId2.forEach((rows, index) => {
        gridRow = document.getElementById(rows).children;
        gridRow[1].textContent = dataValues[14 + index];
        gridRow[2].textContent = dataValues[20 + index];
        gridRow[3].textContent = dataValues[26 + index];
    });

    // Update the individual values separately
    document.getElementById('value-1').textContent = `Total Energy: ${dataValues[0]} kWh`;
    document.getElementById('value-2').textContent = `Total Power: ${dataValues[1]} kW`;
}

function checkStatus(data) {
    const dataValues = data.split(',').map(value => parseFloat(value).toFixed(0));

    let magInt = dataValues[32];
    let devCas = dataValues[33];
    let ovVolt = dataValues[34];
    let unVolt = dataValues[35];
    let ovCurrent = dataValues[36];
    
    let status = [magInt, devCas, ovVolt, unVolt, ovCurrent]
    let statuses = ['magnetic', 'casing', 'ovVolt', 'unVolt', 'ovCurrent']

    for(let i = 1; i <=5; i++){
        if(status[i-1] == 1){
            document.getElementById(`${statuses[i-1]}Dot`).style.backgroundColor = 'red';
            document.getElementById(`${statuses[i-1]}Dot`).style.animation = 'redBlink 0.3s infinite'
            document.getElementById(`${statuses[i-1]}Status`).textContent = 'Status: DETECTED!'
        } else {
            document.getElementById(`${statuses[i-1]}Dot`).style.backgroundColor = 'green';
            document.getElementById(`${statuses[i-1]}Dot`).style.animation = 'none'
            document.getElementById(`${statuses[i-1]}Status`).textContent = 'Status: NORMAL'
        }
    }
}

function updateWifiNames(){
    var linkContainer = document.getElementById('wifiList');
    linkContainer.innerHTML = '';
    for (var i = 0; i < wifiNames.length; i++){
        var link = document.createElement('a');
        link.textContent = wifiNames[i];
        linkContainer.appendChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    connectToESP8266();
    updateWifiNames();
    const chartContainer = document.getElementById('wrapper');
    let tlabels = ['Total Power', 'Total Energy', 'V R-Y', 'I R-Y', 'F R-Y', 'PF R-Y', 'V Y-B', 'I Y-B', 'F Y-B', 'PF Y-B', 'V B-R', 'I B-R', 'F B-R', 'PF B-R', 'V R', 'I R', 'P R', 'E R', 'F R', 'PF R', 'V Y', 'I Y', 'P Y', 'E Y', 'F Y', 'PF Y', 'V B', 'I B', 'P B', 'E B', 'F B', 'PF B'];
    for (let i = 1; i <= 32; i++) {   
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${i}`;
        canvas.style.display = i === 1 ? 'block' : 'none'; // Show only the first chart initially
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        charts.push(new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: tlabels[i-1],
                    data: [],
                    borderColor: '#007bff',
                    borderWidth: 2
                    
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: tlabels[i-1],
                        color: 'black',
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        ticks: {
                            color: "#000"
                        }
                    }
                },
                maintainAspectRatio: false,
                elements: {
                    point:{
                        radius: 0
                    },
                    line: {
                        tension: 0.4  
                    }
                }
            }
        }));
    }

    const graphSelect = document.getElementById('graphSelect');
    for (let i = 1; i <= 32; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${tlabels[i-1]} Graph`;
        graphSelect.appendChild(option);
    }
    graphSelect.addEventListener('change', () => {
        const selectedGraphIndex = graphSelect.selectedIndex;
        updateGraphDisplay(selectedGraphIndex);
    });
    
    document.getElementById('downloadButton').addEventListener('click', downloadAllGraphsCSV);

    document.getElementById('wifiConfig').addEventListener('click', () => {
        document.getElementById("mainWrapper").style.display = "none";
        document.getElementById("wifiWrapper").style.display = "flex";
    });

    document.getElementById('exitWifiConfig').addEventListener('click', () => {
        document.getElementById("mainWrapper").style.display = "flex";
        document.getElementById("wifiWrapper").style.display = "none";
    });

    document.getElementById("wifiList").addEventListener('click', function(event) {
        if (event.target.tagName === 'A') {
          var clickedText = event.target.textContent;
          document.getElementById("wifiSsid").value = clickedText;
        }
    });

    document.getElementById('refreshWifi').addEventListener('click', () => {
        socket.send(["REFRESH"]);
        updateWifiNames();
    });

    document.getElementById('connectBtn').addEventListener('click', () => {
        let ssid = document.getElementById("wifiSsid").value;
        let pwd = document.getElementById("wifiPwd").value;

        if (ssid == '' || pwd == ''){
            alert("Please select the Wifi and enter valid password.")
        } else {
            socket.send(["CONNECT",ssid, pwd]);
        }
        
    });

    updateGraphDisplay(1);
    updateWifiNames();
});
