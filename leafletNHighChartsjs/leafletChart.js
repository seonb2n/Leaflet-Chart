const map = L.map('map').setView([35.411621824, 127.390230052], 15);
const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    noWrap: true
}).addTo(map);

/*
 * 화면에 polygon 추가
 */
function onEachFeature(feature, layer) {
    const div = L.DomUtil.create('div', 'chart');
    layer.bindPopup(div);
    layer.on('popupopen', function (e) {
        console.log(e.target);  // layer object
        console.log(e.target.feature); // layer's feature object
        console.log(e.popup); // popup object
        console.log(e.popup.getContent()); // the div
        Highcharts.chart(e.popup.getContent(), {
            title: {
                text: 'Popup Chart'
            },
            yAxis: {
                title: {
                    text: 'This is Type'
                }
            },
            xAxis: {
                title: {
                    text: 'Case'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            series: [{
                name: 'Type A',
                data: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()]
            },
                {
                    name: 'Type B',
                    data: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()]
                },
            ]
        });

    })
}
const nowSize = 5000;
const featureData = async () => {
    const data = await fetch("http://localhost:8080/data?size="+nowSize, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    const geoJsonData = await data.json();
    console.log(geoJsonData);
    const featureDataLayer = await L.geoJSON(geoJsonData, {
        onEachFeature: onEachFeature,
        style: function (feature) {
            const properties = Math.random();
            if (properties > 0.75) return {color: "#003399", fillColor: "#003399", opacity: 0.5, fillOpacity: 0.5};
            else if (properties > 0.5) return {color: "#4374D9", fillColor: "#4374D9", opacity: 0.5, fillOpacity: 0.5};
            else if (properties > 0.25) return {color: "#6799FF", fillColor: "#6799FF", opacity: 0.5, fillOpacity: 0.5};
            else return {color: "#B2CCFF", fillColor: "#B2CCFF"};
        }
    }).addTo(map);
}
featureData();

/*
* 화면에 편집 툴인 Geoman 추가
*/
const addGeoManToMap = () => {
    map.pm.addControls({
        position: 'topleft',
        drawCircle: false,
    });
}
addGeoManToMap();

/*
* Geoman 으로 변경된 데이터에 따른 새로운 Polygon Layer console log 추가
*/
const onClickUpdateData = (e) => {
    const featureData = map.pm.getGeomanLayers(true).toGeoJSON();
    console.log(featureData);
}