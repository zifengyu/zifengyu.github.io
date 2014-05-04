shikai.data = ( function() {
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    var dataMap, statsMap = {};
    var responseTimeMap = {};
    var dataStartTime = 0, dataEndTime = 0;
    var filterStartTime = 0, filterEndTime = 0;

    var loadFile, getStats, getDataSeris, getFilter, setFilter;
    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN UTILITY METHODS ------------------

    //-------------------- END UTILITY METHODS -------------------

    //--------------------- BEGIN DOM METHODS --------------------
    //---------------------- END DOM METHODS ---------------------

    //------------------- BEGIN EVENT HANDLERS -------------------
    // example: onClickButton = ...
    //-------------------- END EVENT HANDLERS --------------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    // Begin public method /loadFile/
    // Purpose : Load data from csv file (Jmeter)
    // Arguments : File path
    // Settings :
    // * dataMap, dataStartTime, dataEndTime, filterStartTime, filterEndTime
    // Returns : true, render resposne time chart
    // Throws : none
    //
    loadFile = function(file) {
      var reader = new FileReader();
       var progress = document.querySelector('.percent');

      reader.onload = function(e) {
        var i;
        var transaction_name, is_success, timestamp, response_time;
        var first_transaction_name;

        dataMap = $.csv.toArrays(e.target.result);

        responseTimeMap = {};
        dataStartTime = 0;
        dataEndTime = 0;

        for ( i = 0; i < dataMap.length; i++) {

          transaction_name = dataMap[i][2];
          if (first_transaction_name === undefined) {
            first_transaction_name = transaction_name;
          }
          is_success = (dataMap[i][7].toLowerCase() === 'true');
          timestamp = parseInt(dataMap[i][0]);

          if (dataStartTime === 0 || dataStartTime > timestamp) {
            dataStartTime = timestamp;
          }
          if (dataEndTime === 0 || dataEndTime < timestamp) {
            dataEndTime = timestamp;
          }

          response_time = dataMap[i][1];
          if (responseTimeMap[transaction_name] === undefined) {
            responseTimeMap[transaction_name] = [];
          }
          responseTimeMap[transaction_name].push({
            timestamp : timestamp,
            response_time : parseInt(response_time, 10),
            is_success : is_success
          });

        }
        filterStartTime = dataStartTime;
        filterEndTime = dataEndTime;        
        renderResponseTimeChart(first_transaction_name);
      };
      reader.onprogress = function (evt) {
    // evt is an ProgressEvent.
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      // Increase the progress bar length.
      if (percentLoaded < 100) {
        progress.style.width = percentLoaded + '%';
        progress.textContent = percentLoaded + '%';
      }
    }
  };
  reader.onloadstart = function(e) {
      document.getElementById('progress_bar').className = 'loading';
    };
      var text = reader.readAsText(file);

      return true;
    };
    // End public method /configModule/

    // Begin public method /getStats/
    // Purpose : Generate statistics data
    // Arguments : filter start time and end time
    // Returns : stats object
    // Throws : nonaccidental
    //
    getStats = function(start_time, end_time) {
      var transcation_name;
      var i;

      statsMap = {};

      for (transaction_name in responseTimeMap) {
        var time_arr = [];
        var ok = 0, ko = 0;
        var min = 0, max = 0, mean = 0, dev = 0, per1 = 0, per2 = 0, req_per_sec = 0;
        for ( i = 0; i < responseTimeMap[transaction_name].length; i++) {
          var timestamp = responseTimeMap[transaction_name][i].timestamp;
          if (timestamp >= start_time && timestamp <= end_time) {
            if (responseTimeMap[transaction_name][i].is_success) {
              mean += responseTimeMap[transaction_name][i].response_time;
              time_arr.push(responseTimeMap[transaction_name][i].response_time);
              ok++;
            } else {
              ko++;
            }
          }
        }

        time_arr.sort(function(a, b) {
          return a - b;
        });

        if (time_arr.length !== 0) {
          min = time_arr[0];
          max = time_arr[time_arr.length - 1];
          mean = parseInt(mean / time_arr.length);
          per1 = time_arr[parseInt((time_arr.length - 1) * 90 / 100)];
          per2 = time_arr[parseInt((time_arr.length - 1) * 95 / 100)];
          req_per_sec = end_time === start_time ? 0 : (ok + ko) * 1000 * 60 / (end_time - start_time);
          for ( i = 0; i < time_arr.length; i++) {
            dev += (time_arr[i] - mean) * (time_arr[i] - mean);
          }
          dev = Math.sqrt(dev / time_arr.length);
        }

        statsMap[transaction_name] = {
          name : transaction_name,
          numberOfRequests : {
            total : ok + ko,
            ok : ok,
            ko : ko
          },
          minResponseTime : {
            total : min,
            ok : min,
            ko : "-"
          },
          maxResponseTime : {
            total : max,
            ok : max,
            ko : "-"
          },
          meanResponseTime : {
            total : mean,
            ok : mean,
            ko : "-"
          },
          standardDeviation : {
            total : dev.toFixed(2),
            ok : dev.toFixed(2),
            ko : "-"
          },
          percentiles1 : {
            total : per1,
            ok : per1,
            ko : "-"
          },
          percentiles2 : {
            total : per2,
            ok : per2,
            ko : "-"
          },
          meanNumberOfRequestsPerSecond : {
            total : req_per_sec.toFixed(2),
            ok : req_per_sec.toFixed(2),
            ko : "-"
          }
        };
      }

      return statsMap;
    };
    // End public method /getStats/

    //Start public method /getDataSeris/
    getDataSeris = function(transaction_name) {
      var series = [];
      var i;
      var time_list = [];

      for ( i = 0; i < responseTimeMap[transaction_name].length; i++) {
        if (responseTimeMap[transaction_name][i].is_success) {
          //if (responseTimeMap[transaction_name][i].timestamp in time_list) {
          //} else {
          time_list.push(responseTimeMap[transaction_name][i].timestamp);
          series.push([responseTimeMap[transaction_name][i].timestamp, responseTimeMap[transaction_name][i].response_time]);
          //}
        } //else {

        //}
      }

      series.sort(function sort_by_time(a, b) {
        return a[0] - b[0];
      });

      if (series.length === 0) {
        series = [[dataStartTime, undefined]];
      }

      return {
        data : series
      };
    };
    //End public method /getDataSeris/

    //Start public method /getFilter/
    getFilter = function() {
      return {
        data_start_time : dataStartTime,
        data_end_time : dataEndTime,
        filter_start_time : filterStartTime,
        filter_end_time : filterEndTime
      };
    };
    //End public method /getFilter/

    //Start public method /setFilter/
    setFilter = function(filter_map) {
      filterStartTime = filter_map.filter_start_time;
      filterEndTime = filter_map.filter_end_time;
    };
    //End public method /setFilter/

    //Start public method /getTransactionStats/
    getTransactionStats = function(transaction_name) {
      var ok = 0, ko = 0;

      for ( i = 0; i < responseTimeMap[transaction_name].length; i++) {
        if (responseTimeMap[transaction_name][i].timestamp >= filterStartTime && responseTimeMap[transaction_name][i].timestamp <= filterEndTime) {
          if (responseTimeMap[transaction_name][i].is_success) {
            ok++;
          } else {
            ko++;
          }
        }
      }
      return {
        ok : ok,
        ko : ko
      };
    };
    //End public method /getTransactionStats/

    // return public methods
    return {
      loadFile : loadFile,
      getStats : getStats,
      getDataSeris : getDataSeris,
      getFilter : getFilter,
      setFilter : setFilter,
      getTransactionStats : getTransactionStats
    };
    //------------------- END PUBLIC METHODS ---------------------

  }());
