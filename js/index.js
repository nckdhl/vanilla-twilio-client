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
  const callControlContainer = document.querySelector(
    "#call-control-container"
  );
  const incominCallModal = document.querySelector("#incoming-call-modal");
  const answerCallButton = document.querySelector("#answer-button");
  const dismissCallButton = document.querySelector("#dismiss-button");

  let calling = true;

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

  const toggleHangUpButton = () => {
    console.log("toggled");
    if (calling) {
      hangupButton.style.display = "initial";
      callButton.style.display = "none";
    } else {
      hangupButton.style.display = "none";
      callButton.style.display = "initial";
    }
    calling = !calling;
  };

  readyButton.addEventListener("click", () => {
    readyButton.style.display = "none";
    callControlContainer.style.display = "inherit";
    logger.style.display = "inherit";

    log("Requesting Capability Token... ");

    const url = "http://3812301a.ngrok.io/twilio/token";
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
          toggleHangUpButton();
        });

        Twilio.Device.disconnect(function(conn) {
          log("Call ended.");
          toggleHangUpButton();
        });

        Twilio.Device.incoming(function(conn) {
          console.log(conn);
          log("Incoming connection from " + conn.parameters.From);
          setTimeout(() => {
            $("#incoming-call-modal").modal("toggle");
          }, 500);

          function answer(connection, event) {
            connection.accept();
          }
          function reject(connection, event) {
            connection.reject();
            $("#incoming-call-modal").modal("toggle");
            log("Call ended.");
            //toggleHangUpButton();
          }

          document
            .querySelector("#answer-button")
            .addEventListener("click", answer.bind(event, conn), {
              once: true
            });

          document
            .querySelector("#dismiss-button")
            .addEventListener("click", reject.bind(event, conn), {
              once: true
            });
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
    //toggleHangUpButton();
    Twilio.Device.connect(params);
  });

  hangupButton.addEventListener("click", () => {
    log("Hanging up...");
    //toggleHangUpButton();
    Twilio.Device.disconnectAll();
  });
});
