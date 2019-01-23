(function() {
  function Log(message) {
    var name = 'WebPerformance.js';
    console.log('[' + name +'] ' + message);
  }

  Log('Started.');

  var webPerformance = {
    PerformanceApi: null,
    PerformanceApiSupported: true,
    PerformanceWebResourceApiSupported: true,
    PagePerformanceMetrics: null,
    ResourcePerformanceMetrics: null
  };

  function PagePerformanceMetrics() {
    if (!webPerformance.PerformanceApiSupported) {
      Log('Tried to get metrics but agent does not support Performance Api.');
      return null;
    }

    var rawPerformanceObject = webPerformance.PerformanceApi.timing;

    return {
      // Provided Data
      timings: {
        connectStart: rawPerformanceObject.connectStart,
        connectEnd: rawPerformanceObject.connectEnd,
        domComplete: rawPerformanceObject.domComplete,
        domContentLoadedEventStart: rawPerformanceObject.domContentLoadedEventStart,
        domContentLoadedEventEnd: rawPerformanceObject.domContentLoadedEventEnd,
        domInteractive: rawPerformanceObject.domInteractive,
        domLoading: rawPerformanceObject.domLoading,
        domainLookupEnd: rawPerformanceObject.domainLookupEnd,
        domainLookupStart: rawPerformanceObject.domainLookupStart,
        fetchStart: rawPerformanceObject.fetchStart,
        loadEventEnd: rawPerformanceObject.loadEventEnd,
        loadEventStart: rawPerformanceObject.loadEventStart,
        navigationStart: rawPerformanceObject.navigationStart,
        redirectEnd: rawPerformanceObject.redirectEnd,
        redirectStart: rawPerformanceObject.redirectStart,
        requestStart: rawPerformanceObject.requestStart,
        responseEnd: rawPerformanceObject.responseEnd,
        responseStart: rawPerformanceObject.responseStart,
        secureConnectionStart: rawPerformanceObject.secureConnectionStart,
        unloadEventEnd: rawPerformanceObject.unloadEventEnd,
        unloadEventStart: rawPerformanceObject.unloadEventStart
      },

      // Calculated Data - Individual navigation timing elements
      durations: {
        unloadEventDuration: rawPerformanceObject.unloadEventEnd - rawPerformanceObject.unloadEventStart,
        redirectDuration: rawPerformanceObject.redirectEnd - rawPerformanceObject.redirectStart,
        domainLookupDuration: rawPerformanceObject.domainLookupEnd - rawPerformanceObject.domainLookupStart, // DNS
        connectionDuration: rawPerformanceObject.connectEnd - rawPerformanceObject.connectStart, // TCP
        requestDuration: rawPerformanceObject.responseEnd - rawPerformanceObject.requestStart,
        domInitDuration: rawPerformanceObject.domInteractive - rawPerformanceObject.responseEnd,
        domProcessingDuration: rawPerformanceObject.domComplete - rawPerformanceObject.domInteractive,
        loadEventDuration: rawPerformanceObject.loadEventEnd - rawPerformanceObject.loadEventStart
      },

      // Calcualted Data - Simplified Metrics
      summary: {
        timeToFirstByte: rawPerformanceObject.responseStart - rawPerformanceObject.navigationStart,
        timeToRetrieveResponse: rawPerformanceObject.responseEnd - rawPerformanceObject.fetchStart, // How long did it take to serve?
        timeToFirstPaintAfterResponse: getTimeToFirstPaint(rawPerformanceObject),
        timeToProcessResponse: rawPerformanceObject.loadEventEnd - rawPerformanceObject.responseEnd, // How long did it take to process in browser?
        totalTimeToFirstRender: (rawPerformanceObject.responseEnd - rawPerformanceObject.navigationStart) + getTimeToFirstPaint(rawPerformanceObject),
        totalTimeToUsefulRender: rawPerformanceObject.domContentLoadedEventEnd - rawPerformanceObject.navigationStart,
        totalTimeToReady: rawPerformanceObject.loadEventEnd - rawPerformanceObject.fetchStart
      },

      resources: ResourcePerformanceMetrics()
    };
  }

  // How much time does it take to first render after initial response?
  function getTimeToFirstPaint(timing) {
    if (window.chrome && window.chrome.loadTimes) {
      loadTimes = window.chrome.loadTimes();
      // (Should be equialent to below) chromeReportedLoad = (loadTimes.firstPaintTime - loadTimes.startLoadTime) * 1000;
      timeToFirstPaint = (loadTimes.firstPaintTime * 1000) - timing.navigationStart
      return Math.round(timeToFirstPaint);
    }

    if (timing.msFirstPaint) {
      return timing.msFirstPaint - timing.navigationStart;
    }

    return;
  }

  function ResourcePerformanceMetrics() {
    if (!webPerformance.PerformanceWebResourceApiSupported) {
      Log('Tried to get metrics but agent does not support Web Resource Timing Api.');
      return null;
    }

    var entries = webPerformance.PerformanceApi.getEntries();
    if (entries.length == 0) {
      return new Array(0);
    }

    return entries;
  }

  function SetPerformanceApi(webPerformance) {
    var api = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;

    if (typeof(api) === 'undefined') {
      Log('This agent does NOT support the Performance API.');
      webPerformance.PerformanceApiSupported = false;
      webPerformance.PerformanceWebRespourceApiSupported = false;
    } else {
      Log('This agent does support the Performance API.');
    }

    if (typeof(api) === 'undefined' || !('getEntriesByType' in api) || !(api.getEntriesByType('resource') instanceof Array)) {
      Log('This agent does NOT support the Resource Timing API.');
      webPerformance.PerformanceWebRespourceApiSupported = false;
    } else {
      Log('This agent does support the Resource Timing API.');
    }

    webPerformance.PerformanceApi = api;
  }

  function Initialize(webPerformance) {
    Log('Starting Initialization.');

    if (window.webPerformance) {
      Log('window.webPerformance already set. Aborting webPerformance.js setup.');
      return;
    }

    SetPerformanceApi(webPerformance);
    if (typeof(webPerformance.PerformanceApi) === 'undefined') {
      Log('Aborting Initialization.');
      return;
    }

    webPerformance.PagePerformanceMetrics = PagePerformanceMetrics;
    webPerformance.ResourcePerformanceMetrics = ResourcePerformanceMetrics;

    Log('Finished Initialization.');
    return webPerformance;
  }

  window.webPerformance = Initialize(webPerformance);

  Log('Finished.');
})();
