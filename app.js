(function () {
  "use strict";

  var monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  var weekdayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  var weekdayShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  var els = {
    dashboard: document.getElementById("dashboard"),
    clock: document.getElementById("clock"),
    dateLabel: document.getElementById("dateLabel"),
    weekLabel: document.getElementById("weekLabel"),
    weatherIcon: document.getElementById("weatherIcon"),
    weatherHigh: document.getElementById("weatherHigh"),
    weatherLow: document.getElementById("weatherLow"),
    weatherSummary: document.getElementById("weatherSummary"),
    weatherAdvice: document.getElementById("weatherAdvice"),
    weatherAdviceIcon: document.getElementById("weatherAdviceIcon"),
    weatherAdviceHeadline: document.getElementById("weatherAdviceHeadline"),
    weatherAdviceDetail: document.getElementById("weatherAdviceDetail"),
    trainStatus: document.getElementById("trainStatus"),
    trainStatusIcon: document.getElementById("trainStatusIcon"),
    trainStatusMain: document.getElementById("trainStatusMain"),
    trainStatusDetail: document.getElementById("trainStatusDetail"),
    trainList: document.getElementById("trainList"),
    currentMonth: document.getElementById("currentMonth"),
    nextMonth: document.getElementById("nextMonth"),
    dayDonut: document.getElementById("dayDonut"),
    weekDonut: document.getElementById("weekDonut"),
    monthDonut: document.getElementById("monthDonut"),
    yearDonut: document.getElementById("yearDonut"),
    dayPercent: document.getElementById("dayPercent"),
    weekPercent: document.getElementById("weekPercent"),
    monthPercent: document.getElementById("monthPercent"),
    yearPercent: document.getElementById("yearPercent")
  };

  var viewMode = new URLSearchParams(window.location.search).get("view");
  var isFamilyView = viewMode === "family";
  var lastMinute = "";
  var lastDateKey = "";
  var holidayNamesByDate = {};
  var requestedHolidayYears = {};
  var defaultWeatherLocation = {
    latitude: 35.3369,
    longitude: 139.4476
  };
  var AUTO_DETECT_NEAREST_STATION = false;
  var TRAIN_CONFIG = {
    stationName: "辻堂",
    lineName: "東海道線",
    direction: "up",
    walkMinutes: 3,
    platform: "2",
    destinationLabel: "品川・東京方面"
  };
  var TOKAIDO_UP_TIMETABLE = {
    weekday: [
      "05:12", "05:25", "05:39", "05:52",
      "06:03", "06:14", "06:25", "06:36", "06:47", "06:58",
      "07:08", "07:18", "07:28", "07:38", "07:48", "07:58",
      "08:08", "08:18", "08:28", "08:39", "08:50",
      "09:02", "09:12", "09:22", "09:32", "09:42", "09:52",
      "10:02", "10:12", "10:22", "10:32", "10:42", "10:52",
      "11:02", "11:12", "11:22", "11:32", "11:42", "11:52",
      "12:02", "12:12", "12:22", "12:32", "12:42", "12:52",
      "13:02", "13:12", "13:22", "13:32", "13:42", "13:52",
      "14:02", "14:12", "14:22", "14:32", "14:42", "14:52",
      "15:02", "15:12", "15:22", "15:32", "15:42", "15:52",
      "16:02", "16:12", "16:22", "16:32", "16:42", "16:52",
      "17:02", "17:12", "17:22", "17:32", "17:42", "17:52",
      "18:02", "18:12", "18:22", "18:32", "18:42", "18:52",
      "19:02", "19:12", "19:22", "19:32", "19:42", "19:52",
      "20:02", "20:12", "20:22", "20:32", "20:42", "20:52",
      "21:02", "21:12", "21:22", "21:32", "21:42", "21:52",
      "22:04", "22:17", "22:30", "22:43", "22:56",
      "23:09", "23:22", "23:35", "23:48"
    ],
    weekend: [
      "05:14", "05:29", "05:44", "05:59",
      "06:14", "06:29", "06:44", "06:59",
      "07:14", "07:29", "07:44", "07:59",
      "08:12", "08:24", "08:36", "08:48",
      "09:00", "09:12", "09:24", "09:36", "09:48",
      "10:00", "10:12", "10:24", "10:36", "10:48",
      "11:00", "11:12", "11:24", "11:36", "11:48",
      "12:00", "12:12", "12:24", "12:36", "12:48",
      "13:00", "13:12", "13:24", "13:36", "13:48",
      "14:00", "14:12", "14:24", "14:36", "14:48",
      "15:00", "15:12", "15:24", "15:36", "15:48",
      "16:00", "16:12", "16:24", "16:36", "16:48",
      "17:00", "17:12", "17:24", "17:36", "17:48",
      "18:00", "18:12", "18:24", "18:36", "18:48",
      "19:00", "19:12", "19:24", "19:36", "19:48",
      "20:00", "20:12", "20:24", "20:36", "20:48",
      "21:00", "21:12", "21:24", "21:36", "21:48",
      "22:03", "22:18", "22:33", "22:48",
      "23:03", "23:18", "23:33", "23:48"
    ]
  };

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function getDateKey(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function formatTime(date) {
    return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function formatDateLabel(date) {
    return weekdayNames[date.getDay()] + ", " + monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  }

  function getIsoWeekNumber(date) {
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var dayNumber = (target.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    var firstThursday = new Date(target.getFullYear(), 0, 4);
    var firstDayNumber = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
    return 1 + Math.round((target - firstThursday) / 604800000);
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function createCell(tagName, className, text) {
    var cell = document.createElement(tagName);
    cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function renderMonth(container, year, month, today) {
    var title = document.createElement("h2");
    var grid = document.createElement("div");
    var firstDay = new Date(year, month, 1).getDay();
    var totalDays = daysInMonth(year, month);
    var todayKey = getDateKey(today);
    var day;

    title.className = "month-title";
    title.textContent = monthNames[month];
    grid.className = "calendar-grid";

    weekdayShort.forEach(function (label, index) {
      var kind = index === 0 ? " sun" : index === 6 ? " sat" : "";
      grid.appendChild(createCell("div", "weekday" + kind, label));
    });

    for (day = 0; day < firstDay; day += 1) {
      grid.appendChild(createCell("div", "day empty", ""));
    }

    for (day = 1; day <= totalDays; day += 1) {
      var cellDate = new Date(year, month, day);
      var dayClass = "day";
      if (cellDate.getDay() === 0) dayClass += " sun";
      if (cellDate.getDay() === 6) dayClass += " sat";
      if (getDateKey(cellDate) === todayKey) dayClass += " today";
      var dateKey = getDateKey(cellDate);
      var cell = createCell("div", dayClass, day);
      if (holidayNamesByDate[dateKey]) {
        cell.className += " holiday";
        cell.title = holidayNamesByDate[dateKey];
        cell.setAttribute("aria-label", day + " " + holidayNamesByDate[dateKey]);
      }
      grid.appendChild(cell);
    }

    container.textContent = "";
    container.appendChild(title);
    container.appendChild(grid);
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function getProgress(now, start, end) {
    var passed = clampPercent(((now - start) / (end - start)) * 100);
    return {
      passed: passed,
      left: 100 - passed
    };
  }

  function getWeekProgress(now) {
    var start = new Date(now);
    var mondayOffset = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);

    var end = new Date(start);
    end.setDate(start.getDate() + 7);
    return getProgress(now, start, end);
  }

  function getDayProgress(now) {
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return getProgress(now, start, end);
  }

  function getMonthProgress(now) {
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    var end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return getProgress(now, start, end);
  }

  function getYearProgress(now) {
    var start = new Date(now.getFullYear(), 0, 1);
    var end = new Date(now.getFullYear() + 1, 0, 1);
    return getProgress(now, start, end);
  }

  function setProgress(prefix, progress) {
    els[prefix + "Donut"].style.setProperty("--passed", progress.passed);
    els[prefix + "Percent"].textContent = progress.passed + "%";
  }

  function weatherCodeToIcon(code) {
    if (code === 0 || code === 1) return "☀︎";
    if (code === 2 || code === 3 || code === 45 || code === 48) return "☁︎";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "☔";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "❄︎";
    if (code >= 95 && code <= 99) return "⚡";
    return "◌";
  }

  function weatherCodeToSummary(code) {
    if (code === 0 || code === 1) return "晴れ";
    if (code === 2) return "晴れ時々曇り";
    if (code === 3) return "曇り";
    if (code === 45 || code === 48) return "霧";
    if (code >= 51 && code <= 57) return "霧雨";
    if (code >= 61 && code <= 67) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "にわか雨";
    if (code >= 85 && code <= 86) return "にわか雪";
    if (code >= 95 && code <= 99) return "雷雨";
    return "天気情報なし";
  }

  function getClothingAdvice(maxTemp, minTemp, code, precipitationProbability) {
    var hasTemps = typeof maxTemp === "number" && typeof minTemp === "number";
    var diff = hasTemps ? maxTemp - minTemp : 0;
    var rainy = typeof precipitationProbability === "number" && precipitationProbability >= 50;
    var detailSuffix = rainy ? " 雨の日は足元と傘も忘れずに。" : "";

    if (!hasTemps) {
      return {
        headline: "長袖＋薄手の羽織り",
        detail: "天気が安定しない日は、軽く調整できる服装が安心です。"
      };
    }

    if (maxTemp >= 30) {
      return {
        headline: "半袖＋暑さ対策",
        detail: "水分補給と日差し対策を忘れずに。" + detailSuffix
      };
    }

    if (maxTemp >= 25) {
      return {
        headline: "半袖でOK",
        detail: diff >= 8 ? "朝晩用に薄手の羽織りがあると安心です。" + detailSuffix : "日中は軽めの服装で過ごしやすそうです。" + detailSuffix
      };
    }

    if (maxTemp >= 20) {
      return {
        headline: "長袖 or 薄手の羽織り",
        detail: diff >= 6 ? "朝晩は少し肌寒いかもしれません。" + detailSuffix : "一枚で調整しやすい服装がおすすめです。" + detailSuffix
      };
    }

    if (maxTemp >= 15) {
      return {
        headline: "長袖＋薄手のアウター",
        detail: diff >= 5 ? "朝晩は肌寒いので羽織りものがあると安心です。" + detailSuffix : "日中も軽い上着があると過ごしやすそうです。" + detailSuffix
      };
    }

    return {
      headline: "アウターを忘れずに",
      detail: "冷えやすいので、あたたかめの服装がおすすめです。" + detailSuffix
    };
  }

  function setClothingAdvice(data) {
    var daily = data && data.daily;
    var code = daily && daily.weather_code && daily.weather_code[0];
    var high = daily && daily.temperature_2m_max && daily.temperature_2m_max[0];
    var low = daily && daily.temperature_2m_min && daily.temperature_2m_min[0];
    var rainChance = daily && daily.precipitation_probability_max && daily.precipitation_probability_max[0];
    var advice = getClothingAdvice(high, low, code, rainChance);

    els.weatherAdviceIcon.textContent = rainyClothingIcon(code, rainChance);
    els.weatherAdviceHeadline.textContent = advice.headline;
    els.weatherAdviceDetail.textContent = advice.detail;
  }

  function rainyClothingIcon(code, precipitationProbability) {
    var rainy = (typeof precipitationProbability === "number" && precipitationProbability >= 50)
      || code === 61 || code === 63 || code === 65 || code === 80 || code === 81 || code === 82;
    return rainy ? "☂" : "👕";
  }

  function setWeatherFallback() {
    els.weatherIcon.textContent = "◌";
    els.weatherHigh.textContent = "--°";
    els.weatherLow.textContent = "--°";
    els.weatherSummary.textContent = "取得不可";
    setClothingAdvice(null);
  }

  function setWeather(data) {
    var daily = data && data.daily;
    var code = daily && daily.weather_code && daily.weather_code[0];
    var high = daily && daily.temperature_2m_max && daily.temperature_2m_max[0];
    var low = daily && daily.temperature_2m_min && daily.temperature_2m_min[0];

    els.weatherIcon.textContent = weatherCodeToIcon(code);
    els.weatherHigh.textContent = typeof high === "number" ? Math.round(high) + "°" : "--°";
    els.weatherLow.textContent = typeof low === "number" ? Math.round(low) + "°" : "--°";
    els.weatherSummary.textContent = weatherCodeToSummary(code);
    setClothingAdvice(data);
  }

  function getTimetableKind(date) {
    return date.getDay() === 0 || date.getDay() === 6 ? "weekend" : "weekday";
  }

  function timeToMinutes(time) {
    var parts = time.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function getUpcomingTrains(now, timetable, walkMinutes) {
    var rideReady = new Date(now);
    var readyMinutes;
    var todayKind = getTimetableKind(rideReady);
    var tomorrow = new Date(rideReady);
    var tomorrowKind;
    var todayRows;
    var tomorrowRows;
    var upcoming = [];

    rideReady.setMinutes(rideReady.getMinutes() + walkMinutes);
    readyMinutes = rideReady.getHours() * 60 + rideReady.getMinutes();
    todayKind = getTimetableKind(rideReady);
    todayRows = timetable[todayKind] || timetable.weekday;

    todayRows.forEach(function (time) {
      if (timeToMinutes(time) >= readyMinutes && upcoming.length < 3) {
        upcoming.push({
          time: time,
          platform: TRAIN_CONFIG.platform,
          destination: TRAIN_CONFIG.destinationLabel
        });
      }
    });

    if (upcoming.length < 3) {
      tomorrow.setDate(rideReady.getDate() + 1);
      tomorrowKind = getTimetableKind(tomorrow);
      tomorrowRows = timetable[tomorrowKind] || timetable.weekday;
      tomorrowRows.some(function (time) {
        upcoming.push({
          time: time,
          platform: TRAIN_CONFIG.platform,
          destination: TRAIN_CONFIG.destinationLabel
        });
        return upcoming.length >= 3;
      });
    }

    return upcoming;
  }

  function getTrainStatus() {
    return {
      state: "normal",
      icon: "✓",
      main: "NORMAL OPERATION",
      detail: "遅延は発生していません"
    };
  }

  function renderTrainStatus(status) {
    var current = status || {
      state: "unknown",
      icon: "!",
      main: "STATUS UNKNOWN",
      detail: "運行情報を取得できません"
    };

    els.trainStatus.dataset.state = current.state;
    els.trainStatusIcon.textContent = current.icon;
    els.trainStatusMain.textContent = current.main;
    els.trainStatusDetail.textContent = current.detail;
  }

  function renderTrainList(trains) {
    els.trainList.textContent = "";
    trains.forEach(function (train) {
      var item = document.createElement("li");
      var time = document.createElement("strong");
      var platform = document.createElement("span");
      var destination = document.createElement("p");

      time.textContent = train.time;
      platform.textContent = "PLATFORM " + train.platform;
      destination.textContent = train.destination;

      item.appendChild(time);
      item.appendChild(platform);
      item.appendChild(destination);
      els.trainList.appendChild(item);
    });
  }

  function renderTrainPanel(now) {
    try {
      renderTrainStatus(getTrainStatus());
      renderTrainList(getUpcomingTrains(now, TOKAIDO_UP_TIMETABLE, TRAIN_CONFIG.walkMinutes));
    } catch (error) {
      renderTrainStatus(null);
      renderTrainList([]);
    }
  }

  function fetchWeather(latitude, longitude) {
    if (!window.fetch) {
      setWeatherFallback();
      return;
    }

    var url = "https://api.open-meteo.com/v1/forecast"
      + "?latitude=" + encodeURIComponent(latitude)
      + "&longitude=" + encodeURIComponent(longitude)
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min"
      + ",precipitation_probability_max"
      + "&timezone=Asia%2FTokyo";

    fetch(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Weather API request failed");
        return response.json();
      })
      .then(setWeather)
      .catch(setWeatherFallback);
  }

  function updateWeather() {
    if (!navigator.geolocation) {
      fetchWeather(defaultWeatherLocation.latitude, defaultWeatherLocation.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      function () {
        fetchWeather(defaultWeatherLocation.latitude, defaultWeatherLocation.longitude);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 3600000,
        timeout: 6000
      }
    );
  }

  function rememberHolidays(data) {
    Object.keys(data || {}).forEach(function (dateKey) {
      holidayNamesByDate[dateKey] = data[dateKey];
    });
  }

  function fetchHolidaysForYear(year, today) {
    requestedHolidayYears[year] = true;
    return fetch("https://holidays-jp.github.io/api/v1/" + year + "/date.json", {
      cache: "force-cache"
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Holiday API request failed");
        return response.json();
      })
      .then(rememberHolidays)
      .catch(function () {
        return fetch("https://holidays-jp.github.io/api/v1/date.json", {
          cache: "force-cache"
        })
          .then(function (response) {
            if (!response.ok) throw new Error("Holiday API fallback failed");
            return response.json();
          })
          .then(rememberHolidays);
      })
      .catch(function () {
        return null;
      })
      .then(function () {
        renderStaticForDate(today);
      });
  }

  function ensureHolidayData(now) {
    if (!window.fetch) return;

    var years = [now.getFullYear()];
    var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (!isFamilyView) {
      years.push(nextMonth.getFullYear());
    }

    years.forEach(function (year) {
      if (!requestedHolidayYears[year]) {
        fetchHolidaysForYear(year, new Date(now));
      }
    });
  }

  function renderStaticForDate(now) {
    var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    els.dateLabel.textContent = formatDateLabel(now);
    els.weekLabel.textContent = "WEEK " + pad2(getIsoWeekNumber(now));
    renderMonth(els.currentMonth, now.getFullYear(), now.getMonth(), now);

    if (isFamilyView) {
      els.nextMonth.hidden = true;
      els.nextMonth.textContent = "";
    } else {
      els.nextMonth.hidden = false;
      renderMonth(els.nextMonth, nextMonth.getFullYear(), nextMonth.getMonth(), now);
    }

    ensureHolidayData(now);
  }

  function update() {
    var now = new Date();
    var minute = formatTime(now);
    var dateKey = getDateKey(now);

    if (minute !== lastMinute) {
      els.clock.textContent = minute;
      els.clock.setAttribute("datetime", now.toISOString());
      renderTrainPanel(now);
      lastMinute = minute;
    }

    if (dateKey !== lastDateKey) {
      renderStaticForDate(now);
      lastDateKey = dateKey;
    }

    setProgress("day", getDayProgress(now));
    setProgress("week", getWeekProgress(now));
    setProgress("month", getMonthProgress(now));
    setProgress("year", getYearProgress(now));
  }

  function nudgeDashboard() {
    var x = Math.round(Math.random() * 6) - 3;
    els.dashboard.style.setProperty("--nudge-x", x + "px");
    els.dashboard.style.setProperty("--nudge-y", "0px");
  }

  if (isFamilyView) {
    els.dashboard.classList.add("family-view");
  }

  update();
  setWeatherFallback();
  updateWeather();
  nudgeDashboard();
  window.setInterval(update, 1000);
  window.setInterval(updateWeather, 3600000);
  window.setInterval(nudgeDashboard, 240000);
})();
