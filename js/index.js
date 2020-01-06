window.addEventListener("load", function() {
  // Initialize and bind all necessary components
  const logger = document.querySelector("#log");
  const clientName = document.querySelector("#client-name");
  //   const ringtoneDevices = document.querySelector("#speaker-devices");
  //   const speakerDevices = document.querySelector("#speaker-devices");
  //   const inputVolumeBar = document.querySelector("#input-volume");
  //   const outputVolumeBar = document.querySelector("#output-volume");
  //   const volumeIndicators = document.querySelector("#volume-indicators");
  const hangupButton = document.querySelector("#hangup-btn");
  const callButton = document.querySelector("#call-btn");
  const numberInput = document.querySelector("#number-input");
  const readyButton = document.querySelector("#readyButton");

  /**
   * Adds a message to the log container in <p> tags
   * @param {Message to be added to log} message
   */
  const log = message => {
    logger.innerHTML += "<p>&gt;&nbsp;" + message + "</p>";
    logger.scrollTop = logger.scrollHeight;
  };

  const setClientNameUI = name => {
    clientName.innerHTML = "Your client name: <strong>" + name + "</strong>";
  };

  readyButton.addEventListener("click", () => {
    log("Requesting Capability Token... ");

    const url = "http://a6f77e9d.ngrok.io/twilio/token";
    const params = JSON.stringify({
      authToken: localStorage.getItem("authToken")
    });
    console.log(params);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }, // parameter format
      body: params
    })
      .then(response => response.json())
      .then(success);

    function success(data) {
      if (data) {
        log("Got a token.");
        console.log("Token " + data.token);

        // Setup Twilio device
        Twilio.Device.setup(data.token);

        Twilio.Device.ready(function(device) {
          log("Twilio.Device Ready!");
        });

        Twilio.Device.connect(function(conn) {
          log("Successfully established call!");
          callButton.style.display = "none";
          hangupButton.style.display = "initial";
        });

        Twilio.Device.disconnect(function(conn) {
          log("Call ended.");
          hangupButton.style.display = "none";
          callButton.style.display = "initial";
        });

        Twilio.Device.incoming(function(conn) {
          log("Incoming connection from " + conn.parameters.From);

          // accept the incoming connection and start two-way audio
          conn.accept();
        });

        setClientNameUI(data.identity);
      } else {
        log("Could not get a token from server!");
      }
    }
  });

  callButton.addEventListener("click", () => {
    let params = {
      To: numberInput.value
    };

    log("Calling " + params.To + "....");
    console.log("Calling " + params.To + "....");

    Twilio.Device.connect(params);
  });

  hangupButton.addEventListener("click", () => {
    log("Hanging up...");
    Twilio.Device.disconnectAll();
  });
});
