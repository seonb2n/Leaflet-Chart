const centerLat = 37.435683968;
const centerLong = 126.993767011

let editableLayer = new L.FeatureGroup();
let originLayer;
let originalLayerStyle = {};

const progressDiv = document.getElementById("progress_div");
let nowChartType = 1;

const map = L.map('map').setView([centerLat, centerLong], 17);
// const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//     noWrap: true
// }).addTo(map);

/**
 * 보고 싶은 데이터의 타입을 확인할 수 있는 button
 */
const customControlDataTypeBtn = L.Control.extend({

    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('input');
        container.type = "button";
        container.value = "세대수";

        //container.style.backgroundColor = 'white';
        container.style.backgroundSize = "30px 30px";
        container.style.width = '100px';
        container.style.height = '30px';

        container.onmouseover = function () {
            container.style.backgroundColor = 'lightblue';
        }
        container.onmouseout = function () {
            container.style.backgroundColor = 'white';
        }

        container.onclick = function () {
            if (container.value === "세대수") {
                container.value = "용적률";
                nowChartType = 2;
            } else {
                container.value = "세대수";
                nowChartType = 1;
            }
        }

        return container;
    }
});

map.addControl(new customControlDataTypeBtn());


/**
 * 맵 타일 바꾸는 기능 추가
 */
let dataLayer;
const switcher = new L.basemapsSwitcher([
    {
        layer: L.tileLayer('http://10.10.12.102:8080/tile/{z}/{x}/{y}.png', {
            minZoom: 10,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map), //DEFAULT MAP
        icon: './assets/images/img1.png',
        name: '표준 지도'
    },
    {
        layer: L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
            minZoom: 16,
            attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }),
        icon: './assets/images/img2.png',
        name: '축약 지도'
    },
    {
        layer: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            minZoom: 16,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }),
        icon: './assets/images/img3.png',
        name: '지형 지도'
    },
], {position: 'topright'}).addTo(map);

/**
 * map move event
 * 맵이 움직일 때마다 현재 위치에 부합하는 Polygon 을 서버로부터 가져와야 한다.
 * zoom 이 15 이상일 때만 작동한다.
 */
map.on("moveend", function () {
    // console.log("East Cor : " + map.getBounds().getNorthEast().toString());
    // console.log("West Cor : " + map.getBounds().getSouthWest().toString());
    // console.log("Center Zoom : " + map.getZoom().toString());
    // 화면 움직이면 이전에 존재하던 dataLayer 삭제
    if (dataLayer !== undefined) {
        map.removeLayer(dataLayer);
        dataLayer = {};
    }
    if (map.getZoom() >= 15) {
        const mapData = map.getBounds();
        // 서버에 해당 데이터에 해당되는 타일을 요청한다.
        const centerLat = (mapData.getNorthEast().lat + mapData.getSouthWest().lat) / 2;
        const centerLong = (mapData.getNorthEast().lng + mapData.getSouthWest().lng) / 2;
        const area = Math.max(mapData.getNorthEast().lat - mapData.getSouthWest().lat, mapData.getNorthEast().lng - mapData.getSouthWest().lng);
        // console.log(centerLong);
        // console.log(centerLat);
        // console.log(area);
        console.log("fetch!");
        featureData(centerLat, centerLong, area);
    }
});

/*
 * 화면에 polygon 추가하고, popup 시 highcharts 를 그려준다.
 */
function onEachFeature(feature, layer) {
    const div = L.DomUtil.create('div', 'chart');
    layer.bindPopup(div);
    layer.setStyle({pmIgnore: true});
    layer.on('popupopen', function (e) {
        // console.log(e.target);  // layer object
        // console.log(e.target.feature); // layer's feature object
        // console.log(e.popup); // popup object
        // console.log(e.popup.getContent()); // the div
        const futGen = parseFloat(feature.properties.미래세대수 === undefined ? 1000 : feature.properties.미래세대수);
        const nowGen = parseFloat(feature.properties.기본주택세대수 === undefined ? 1000 : feature.properties.기본주택세대수);
        const futSpace = parseFloat(feature.properties.신축용적률 === undefined ? 0 : feature.properties.신축용적률);
        const nowSpace = parseFloat(feature.properties.기존용적률 === undefined ? 0 : feature.properties.기존용적률);

        switch (nowChartType) {
            case 1:
                Highcharts.chart(e.popup.getContent(), {
                    title: {
                        text: '세대수'
                    },
                    yAxis: {
                        title: {
                            text: '단위 : 명'
                        }
                    },
                    xAxis: {
                        title: {
                            text: '단위 : 년'
                        },
                        categories: [new Date().getFullYear(), new Date().getFullYear() + 1]
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle'
                    },
                    series: [{
                        name: '세대수',
                        data: [nowGen, futGen]
                    }
                    ]
                });
                break;
            case 2:
                Highcharts.chart(e.popup.getContent(), {
                    title: {
                        text: '용적률'
                    },
                    yAxis: {
                        title: {
                            text: '단위 : %'
                        }
                    },
                    xAxis: {
                        title: {
                            text: '단위 : 년'
                        },
                        categories: [new Date().getFullYear(), new Date().getFullYear() + 1]
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle'
                    },
                    series: [{
                        name: '용적률',
                        data: [nowSpace, futSpace]
                    }
                    ]
                });
        }
    })
    layer.on('click', () => {
        if (originLayer !== undefined) {
            originLayer.setStyle({
                pmIgnore: true,
                color: originalLayerStyle.color,
                fillColor: originalLayerStyle.fillColor,
            })
        }
        originLayer = layer;
        originalLayerStyle = JSON.parse(JSON.stringify(layer.options));
        editableLayer._layers = {};
        editableLayer.addLayer(layer);
        console.log(editableLayer._layers);
        layer.setStyle({
            pmIgnore: false,
            color: '#FF0000',
            fillColor: '#FF0000',
            opacity: 0.5,
            fillOpacity: 0.5
        });
    });
}

const featureData = async (lat, lng, area) => {
    progressDiv.style.visibility = 'visible';
    requestUrl = "http://10.10.12.102:8070/getGyeongi?";
    params = {"lat": lat, "lng": lng, "area": area};
    const query = Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');

    const data = await fetch(requestUrl + query, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    const geoJsonData = await data.json();
    if (geoJsonData.features !== null) {
        console.log(geoJsonData.features.length);
        dataLayer = await L.geoJSON(geoJsonData, {
            onEachFeature: onEachFeature,
            style: function (feature) {
//            const properties = Math.random();
                const properties = feature.properties.사업단계;
                if (properties === "착공") return {
                    color: "#003399",
                    fillColor: "#003399",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                if (properties === "조합설립") return {
                    color: "#003399",
                    fillColor: "#003399",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                else if (properties === "사업시행") return {
                    color: "#4374D9",
                    fillColor: "#4374D9",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                else if (properties === "정비구역") return {
                    color: "#8F8AFF",
                    fillColor: "#8F8AFF",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                else if (properties === "예정구역") return {
                    color: "#6799FF",
                    fillColor: "#6799FF",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                else if (properties === "관리처분") return {
                    color: "#C1F3FF",
                    fillColor: "#C1F3FF",
                    opacity: 0.2,
                    fillOpacity: 0.2
                };
                else return {
                        color: "#B2CCFF",
                        fillColor: "#B2CCFF",
                        opacity: 0.2,
                        fillOpacity: 0.2
                    };
            }
        }).addTo(map);
    }
    progressDiv.style.visibility = 'hidden';

}
featureData(centerLat, centerLong, 0.01);

/*
* 화면에 편집 툴인 Geoman 추가
*/
const addGeoManToMap = () => {
    map.pm.addControls({
        position: 'topleft',
        rotateMode: false,
    });
}
addGeoManToMap();


/*
* Geoman 으로 변경된 데이터에 따른 새로운 Polygon Layer console log 추가
*/
const onClickUpdateData = (e) => {
    const featureData = map.pm.getGeomanLayers(true).toGeoJSON();
    console.log(featureData);
    const updateUrl = "http://10.10.12.102:8070/update";
    //todo 새로 생성된 Layer 혹은 수정된 Layer 를 Server 에 전달해서 db 반영
    const updateResponse = fetch(updateUrl, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(featureData),
    }).then((res) => console.log(res));
}