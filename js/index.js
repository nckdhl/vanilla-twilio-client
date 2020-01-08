window.addEventListener("load", function() {
  // Initialize and bind all necessary components
  const logger = document.querySelector("#log");
  const clientName = document.querySelector("#client-name");
  const ringtoneDevices = document.querySelector("#ringtone-devices");
  const speakerDevices = document.querySelector("#speaker-devices");
  const inputVolumeBar = document.querySelector("#input-volume");
  const outputVolumeBar = document.querySelector("#output-volume");
  const volumeIndicators = document.querySelector("#volume-indicators");
  const getDevices = document.querySelector("#get-devices");
  const hangupButton = document.querySelector("#hangup-btn");
  const callButton = document.querySelector("#call-btn");
  const numberInput = document.querySelector("#number-input");
  const readyButton = document.querySelector("#readyButton");
  const callControlContainer = document.querySelector(
    "#call-control-container"
  );
  const incomingCallModal = document.querySelector("#incoming-call-modal");
  const answerCallButton = document.querySelector("#answer-button");
  const dismissCallButton = document.querySelector("#dismiss-button");

  let calling = true;
  let twilioDevice;

  const enumDevices = async () => {
    return await navigator.mediaDevices.enumerateDevices();
  };

  console.log(enumDevices().then(value => console.log(value)));
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

  const updateDevices = (selectElement, selectedDevices) => {
    selectElement.innerHTML = "";
    twilioDevice.audio.availableOutputDevices.forEach(function(device, id) {
      let isActive = selectedDevices.size === 0 && id === "default";
      selectedDevices.forEach(function(device) {
        if (device.deviceId === id) {
          isActive = true;
        }
      });

      let option = document.createElement("option");
      option.label = device.label;
      option.setAttribute("data-id", id);
      if (isActive) {
        option.setAttribute("selected", "selected");
      }
      selectElement.appendChild(option);

      if (!selectElement.hasChildNodes()) {
        console.log("No options");
        selectElement.style.display = "none";
      }
    });
  };

  const updateAllDevices = () => {
    console.log("Tried to update all devices.");
    updateDevices(speakerDevices, twilioDevice.audio.speakerDevices.get());
    updateDevices(ringtoneDevices, twilioDevice.audio.ringtoneDevices.get());
  };

  function bindVolumeIndicators(connection) {
    connection.volume(function(inputVolume, outputVolume) {
      let inputColor = "red";
      if (inputVolume < 0.5) {
        inputColor = "green";
      } else if (inputVolume < 0.75) {
        inputColor = "yellow";
      }

      inputVolumeBar.style.width = Math.floor(inputVolume * 300) + "px";
      inputVolumeBar.style.background = inputColor;

      let outputColor = "red";
      if (outputVolume < 0.5) {
        outputColor = "green";
      } else if (outputVolume < 0.75) {
        outputColor = "yellow";
      }

      outputVolumeBar.style.width = Math.floor(outputVolume * 300) + "px";
      outputVolumeBar.style.background = outputColor;
    });
  }

  readyButton.addEventListener("click", () => {
    readyButton.style.display = "none";
    callControlContainer.style.display = "inherit";
    logger.style.display = "inherit";

    log("Requesting Capability Token... ");

    const url = "http://828f5597.ngrok.io/twilio/token";
    const params = JSON.stringify({
      authToken: localStorage.getItem("authToken")
    });
    console.log(params);

    try {
      fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }, // parameter format
        body: params
      })
        .then(response => {
          console.log(response);
          if (response.ok) {
            return response.json();
          } else {
            log(
              "Error: Could not retrieve valid token from server. Try refreshing."
            );
            //throw new Error('Issue retrieving token from server.')
          }
        })
        .then(success);
    } catch (error) {
      log("Error: Could not retrieve valid token from server. Try refreshing.");
      console.log(error.message);
    }

    function success(data) {
      if (data) {
        log("Got a token.");
        console.log("Token " + data.token);

        twilioDevice = new Twilio.Device();
        twilioDevice.setup(data.token);

        const audio = document.createElement("audio");
        console.log("audio: ", audio);

        // Show audio selection UI if it is supported by the browser.
        if (twilioDevice.audio.isOutputSelectionSupported) {
          console.log("Audio selection is supported");
          document.getElementById("output-selection").style.display = "block";
        }

        console.log(twilioDevice.audio.ringtoneDevices.get());

        // Deprecated - Setup Twilio device
        //Twilio.Device.setup(data.token);

        twilioDevice.on("ready", device => {
          log("Twilio VOIP client online. Ready for calls!");
        });

        // Deprecated
        // Twilio.Device.ready(function(device) {
        //   log("Twilio.Device Ready!");
        // });

        twilioDevice.on("error", error => {
          log("Error: " + error.message + " , Code: " + error.code);
        });

        twilioDevice.on("offline", device => {
          log("offline", device => {
            log(
              "Client went offline. Try refreshing page to re-establish connection."
            );
          });
        });

        twilioDevice.on("connect", connection => {
          log("Successfully established call!");
          toggleHangUpButton();
          volumeIndicators.style.display = "block";
          bindVolumeIndicators(connection);
        });

        // Deprecated
        // Twilio.Device.connect(function(conn) {
        //   log("Successfully established call!");
        //   callButton.style.display = "none";
        //   hangupButton.style.display = "initial";
        // });

        twilioDevice.on("disconnect", connection => {
          log("Call ended.");
          toggleHangUpButton();
          volumeIndicators.style.display = "none";
        });

        // Deprecated
        // Twilio.Device.disconnect(function(conn) {
        //   log("Call ended.");
        //   hangupButton.style.display = "none";
        //   callButton.style.display = "initial";
        // });

        twilioDevice.on("incoming", function(conn) {
          console.log(conn);
          log("Incoming connection from " + conn.parameters.From);
          setTimeout(() => {
            $("#incoming-call-modal").modal("toggle");
          }, 500);

          // function answer(connection, event) {
          //   connection.accept();
          // }

          // function reject(connection, event) {
          //   connection.reject();
          //   $("#incoming-call-modal").modal("toggle");
          //   log("Call ended.");
          //   //toggleHangUpButton();
          // }

          document.querySelector("#answer-button").addEventListener(
            "click",
            () => {
              conn.accept();
            },
            {
              once: true
            }
          );

          document.querySelector("#dismiss-button").addEventListener(
            "click",
            () => {
              conn.reject();
              $("#incoming-call-modal").modal("toggle");
              log("Call ended.");
            },
            {
              once: true
            }
          );
        });

        twilioDevice.audio.on("deviceChange", updateAllDevices);

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
    twilioDevice.connect(params);
  });

  hangupButton.addEventListener("click", () => {
    log("Hanging up...");
    //toggleHangUpButton();
    twilioDevice.disconnectAll();
  });

  speakerDevices.addEventListener("change", function() {
    console.log("Speaker device set..");
    let selectedDevices = [].slice
      .call(speakerDevices.children)
      .filter(function(node) {
        return node.selected;
      })
      .map(function(node) {
        return node.getAttribute("data-id");
      });

    twilioDevice.audio.speakerDevices.set(selectedDevices);
  });

  ringtoneDevices.addEventListener("change", function() {
    console.log("Rington device set..");
    let selectedDevices = [].slice
      .call(ringtoneDevices.children)
      .filter(function(node) {
        return node.selected;
      })
      .map(function(node) {
        return node.getAttribute("data-id");
      });

    twilioDevice.audio.ringtoneDevices.set(selectedDevices);
  });

  getDevices.addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(updateAllDevices);
  });
});
