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
    currentMonth: document.getElementById("currentMonth"),
    nextMonth: document.getElementById("nextMonth"),
    dayDonut: document.getElementById("dayDonut"),
    weekDonut: document.getElementById("weekDonut"),
    monthDonut: document.getElementById("monthDonut"),
    yearDonut: document.getElementById("yearDonut"),
    dayPassed: document.getElementById("dayPassed"),
    dayLeft: document.getElementById("dayLeft"),
    weekPassed: document.getElementById("weekPassed"),
    weekLeft: document.getElementById("weekLeft"),
    monthPassed: document.getElementById("monthPassed"),
    monthLeft: document.getElementById("monthLeft"),
    yearPassed: document.getElementById("yearPassed"),
    yearLeft: document.getElementById("yearLeft")
  };

  var lastMinute = "";
  var lastDateKey = "";
  var holidayNamesByDate = {};
  var requestedHolidayYears = {};
  var defaultWeatherLocation = {
    latitude: 35.3369,
    longitude: 139.4476
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
    els[prefix + "Passed"].textContent = progress.passed;
    els[prefix + "Left"].textContent = progress.left;
  }

  function weatherCodeToIcon(code) {
    if (code === 0 || code === 1) return "☀︎";
    if (code === 2 || code === 3 || code === 45 || code === 48) return "☁︎";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "☔";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "❄︎";
    if (code >= 95 && code <= 99) return "⚡";
    return "◌";
  }

  function setWeatherFallback() {
    els.weatherIcon.textContent = "◌";
    els.weatherHigh.textContent = "--°";
    els.weatherLow.textContent = "--°";
  }

  function setWeather(data) {
    var daily = data && data.daily;
    var code = daily && daily.weather_code && daily.weather_code[0];
    var high = daily && daily.temperature_2m_max && daily.temperature_2m_max[0];
    var low = daily && daily.temperature_2m_min && daily.temperature_2m_min[0];

    els.weatherIcon.textContent = weatherCodeToIcon(code);
    els.weatherHigh.textContent = typeof high === "number" ? Math.round(high) + "°" : "--°";
    els.weatherLow.textContent = typeof low === "number" ? Math.round(low) + "°" : "--°";
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

    var nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    [now.getFullYear(), nextMonth.getFullYear()].forEach(function (year) {
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
    renderMonth(els.nextMonth, nextMonth.getFullYear(), nextMonth.getMonth(), now);
    ensureHolidayData(now);
  }

  function update() {
    var now = new Date();
    var minute = formatTime(now);
    var dateKey = getDateKey(now);

    if (minute !== lastMinute) {
      els.clock.textContent = minute;
      els.clock.setAttribute("datetime", now.toISOString());
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

  update();
  setWeatherFallback();
  updateWeather();
  nudgeDashboard();
  window.setInterval(update, 1000);
  window.setInterval(updateWeather, 3600000);
  window.setInterval(nudgeDashboard, 240000);
})();
