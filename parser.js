const nsGarmin = "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2";
const nsExtensions = "http://www.garmin.com/xmlschemas/ActivityExtension/v2";

let originalXML = ''; // To store the original XML string for later modifications
let currentStateXML = ''; // To store updates on site for download

function setupFileInput() {
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const xmlContent = e.target.result;
                originalXML = xmlContent; // Store the original XML
                currentStateXML = originalXML;
                parseXML(xmlContent);
            };
            
            reader.readAsText(file);
        }
    });
}

function parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    displayXML(xmlDoc);

}

function displayXML(xmlDoc) {
    const activity = xmlDoc.getElementsByTagNameNS(nsGarmin, 'Activity')[0];
    const laps = activity.getElementsByTagNameNS(nsGarmin, 'Lap');

    const sport = activity.getAttribute('Sport');
    const id = activity.getElementsByTagNameNS(nsGarmin, 'Id')[0].textContent;

    let outputHtml = `
        <h3>Activity: ${sport}</h3>
        <p>Id: ${id}</p>
        <h4>Laps:</h4>
        <ul>`;

    for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const startTime = lap.getAttribute('StartTime');
        const totalTimeSeconds = lap.getElementsByTagNameNS(nsGarmin, 'TotalTimeSeconds')[0].textContent;
        const distanceMeters = lap.getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent;
        const calories = lap.getElementsByTagNameNS(nsGarmin, 'Calories')[0].textContent;
        const avgHeartRate = lap.getElementsByTagNameNS(nsGarmin, 'AverageHeartRateBpm')[0].getElementsByTagNameNS(nsGarmin, 'Value')[0].textContent;
        const maxHeartRate = lap.getElementsByTagNameNS(nsGarmin, 'MaximumHeartRateBpm')[0].getElementsByTagNameNS(nsGarmin, 'Value')[0].textContent;

        outputHtml += `
            <li>
                <strong>Lap ${i + 1}</strong><br>
                Start Time: ${startTime}<br>
                Total Time: ${totalTimeSeconds} seconds<br>
                Distance: <input type="text" id="distanceLap${i + 1}" value="${distanceMeters}" /> meters<br>
                <button onclick="updateLapDistance(${i})">Update Distance</button><br>
                Calories: ${calories}<br>
                Average Heart Rate: ${avgHeartRate} bpm<br>
                Maximum Heart Rate: ${maxHeartRate} bpm
            </li>`;
        
        const trackpoints = lap.getElementsByTagNameNS(nsGarmin, 'Trackpoint');
/*
        outputHtml += `<h5>Trackpoints for Lap ${i + 1}:</h5><table border=1><thead><td>Time</td><td>Distance (m)</td><td>HR (bpm)</td><td>Speed (m/s)</td><td>Cadence (spm)</td></thead><tbody>`;

        const trackData = Array.from(trackpoints).map(trackpoint => {
            const tpTime = trackpoint.getElementsByTagNameNS(nsGarmin, 'Time')[0].textContent;
            const time = timeToSeconds(tpTime) - timeToSeconds(startTime);
            const distance = trackpoint.getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent;
            const heartRate = trackpoint.getElementsByTagNameNS(nsGarmin, 'HeartRateBpm')[0].getElementsByTagNameNS(nsGarmin, 'Value')[0].textContent;

            const extensions = trackpoint.getElementsByTagNameNS(nsGarmin, 'Extensions')[0];
            const tpx = extensions.getElementsByTagNameNS(nsExtensions, 'TPX')[0];
            const speed = tpx.getElementsByTagNameNS(nsExtensions, 'Speed')[0].textContent;
            const cadence = tpx.getElementsByTagNameNS(nsExtensions, 'RunCadence')[0].textContent;

            return {
                time,
                distance,
                heartRate,
                speed,
                cadence
            };
        });

        trackData.forEach(tp => {
            outputHtml += `
                <tr>
                    <td>${tp.time}</td><td>${tp.distance}</td><td>${tp.heartRate}</td><td>${tp.speed}</td><td>${tp.cadence}</td>
                </tr>`;
        });

        // Insert canvas for the chart
        outputHtml += `</tbody></table>`
        */
        outputHtml += `<canvas id="myChart${i + 1}" style="width:100%;max-width:700px"></canvas>`;
    }

    outputHtml += `</ul>`;
    outputHtml += `<button onclick="saveTCX()">Save TCX</button>`;

    // Finally, display all output
    const output = document.getElementById('output');
    output.innerHTML = outputHtml;

    // Now, create the charts after the DOM is fully updated
    createChart(laps);
}

function createChart(laps) {
    for (let i = 0; i < laps.length; i++) {
        const lap = laps[i];
        const trackpoints = lap.getElementsByTagNameNS(nsGarmin, 'Trackpoint');
        const startTime = lap.getAttribute('StartTime');

        const trackData = Array.from(trackpoints).map(trackpoint => {
            const tpTime = trackpoint.getElementsByTagNameNS(nsGarmin, 'Time')[0].textContent;
            const time = timeToSeconds(tpTime) - timeToSeconds(startTime);
            const distance = trackpoint.getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent;
            const heartRate = trackpoint.getElementsByTagNameNS(nsGarmin, 'HeartRateBpm')[0].getElementsByTagNameNS(nsGarmin, 'Value')[0].textContent;

            const extensions = trackpoint.getElementsByTagNameNS(nsGarmin, 'Extensions')[0];
            const tpx = extensions.getElementsByTagNameNS(nsExtensions, 'TPX')[0];
            const speed = tpx.getElementsByTagNameNS(nsExtensions, 'Speed')[0].textContent;
            const cadence = tpx.getElementsByTagNameNS(nsExtensions, 'RunCadence')[0].textContent;

            return {
                time,
                distance,
                heartRate,
                speed,
                cadence
            };
        });

        const timeArray = trackData.map(tp => tp.time);
        const heartRateArray = trackData.map(tp => tp.heartRate);
        const speedArray = trackData.map(tp => tp.speed);
        const cadenceArray = trackData.map(tp => tp.cadence);
        setTimeout(() => {
            const ctx = document.getElementById(`myChart${i + 1}`).getContext('2d'); // Make sure the canvas is rendered before using Chart.js
            new Chart(ctx, {
                type: "line",
                data: {
                    labels: timeArray, // Make sure these arrays are scoped correctly
                    datasets: [{
                        data: heartRateArray,
                        borderColor: "red",
                        fill: false
                    }, {
                        data: cadenceArray,
                        borderColor: "green",
                        fill: false
                    }, {
                        data: speedArray,
                        borderColor: "blue",
                        fill: false
                    }]
                },
                options: {
                    legend: { display: false }
                }
            });
        }, 0);  // Defer chart creation to the next event loop
    }
}

function updateLapDistance(lapIndex) {
    const newDistance = document.getElementById(`distanceLap${lapIndex + 1}`).value;
    alert(`Lap ${lapIndex + 1} distance updated to: ${newDistance} meters`);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(currentStateXML, 'application/xml');
    const laps = xmlDoc.getElementsByTagNameNS(nsGarmin, 'Lap');

    // Store new distances for all laps
    const newDistances = [];

    // First loop to update lap distances and trackpoints
    for (let i = 0; i < laps.length; i++) {
        const newDistance = parseFloat(document.getElementById(`distanceLap${i + 1}`).value);
        const oldDistance = parseFloat(laps[i].getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent);
        
        // Update the lap distance
        laps[i].getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent = newDistance;

        // Calculate the scaling factor
        const scalingFactor = newDistance / oldDistance;

        // Update all trackpoints in the current lap
        const trackpoints = laps[i].getElementsByTagNameNS(nsGarmin, 'Trackpoint');
        const lapStartDistance = parseFloat(trackpoints[0].getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0].textContent);
        for (let j = 0; j < trackpoints.length; j++) {
            const trackpointDistance = trackpoints[j].getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0];
            const currentDistance = parseFloat(trackpointDistance.textContent);
            const newTrackpointDistance = (currentDistance - lapStartDistance) * scalingFactor + lapStartDistance; // Adjust based on scaling
            trackpointDistance.textContent = newTrackpointDistance.toFixed(2); // Adjusting to 2 decimal places

            const trackpointSpeed = trackpoints[j].getElementsByTagNameNS(nsExtensions, 'Speed')[0];
            const currentSpeed = parseFloat(trackpointSpeed.textContent);
            const newTrackpointSpeed = currentSpeed * scalingFactor; // Adjust based on scaling
            trackpointSpeed.textContent = newTrackpointSpeed.toFixed(2); // Adjusting to 2 decimal places
        }

        // Store the new distance for this lap
        newDistances[i] = newDistance;

        const distanceDifference = newDistance - oldDistance;

        for (let j = i + 1; j < laps.length; j++) {
            const subTrackpoints = laps[j].getElementsByTagNameNS(nsGarmin, 'Trackpoint');
            for (let k = 0; k < subTrackpoints.length; k++) {
                const trackpointDistance = subTrackpoints[k].getElementsByTagNameNS(nsGarmin, 'DistanceMeters')[0];
                const currentDistance = parseFloat(trackpointDistance.textContent);
                const subTrackpointDistance = currentDistance + distanceDifference; // Adjust based on scaling
                trackpointDistance.textContent = subTrackpointDistance.toFixed(2); // Adjusting to 2 decimal places
            }
        }        
    }

    displayXML(xmlDoc);

    const serializer = new XMLSerializer();
    currentStateXML = serializer.serializeToString(xmlDoc);
}

function timeToSeconds(time) {
    let seconds = 0;
    let h = parseFloat(time.substring(11,13));
    let m = parseFloat(time.substring(14,16));
    let s = parseFloat(time.substring(17,23));
    seconds = 3600*h + 60*m + s;
    return seconds;
}

function saveTCX() {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(currentStateXML, 'application/xml');

    const serializer = new XMLSerializer();
    const newXML = serializer.serializeToString(xmlDoc);
    downloadTCXFile(newXML);
}

function downloadTCXFile(data) {
    const blob = new Blob([data], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated_activity.tcx'; // Set the desired file name
    a.click();
    URL.revokeObjectURL(url); // Clean up
}

// Call setup function on page load
window.onload = setupFileInput;
