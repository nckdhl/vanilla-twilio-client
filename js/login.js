window.addEventListener("load", () => {
    const emailInput = document.querySelector("#inputEmail");
    const passwordInput = document.querySelector("#inputPassword");
    const submitBtn = document.querySelector("#submitBtn");

    submitBtn.addEventListener("click", event => {
        event.preventDefault();

        emailInput.setCustomValidity('');

        // checks validity of required elements
        if (emailInput.reportValidity() && passwordInput.reportValidity()) {
            let email = emailInput.value;
            let password = passwordInput.value;

            let params = JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            });


            // AJAX call to send login credentials to database
            // returns true and redirects to main.php if the login was successful and
            // false if it was not, which then causes validity popup on input field
            fetch("http://a6f77e9d.ngrok.io/auth/login", {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json"
                    }, // parameter format
                    body: params
                })
                .then(response => response.json())
                .then(function (data) {
                    console.log(data);
                    if (data.status == 200) {
                        console.log(data);
                        localStorage.setItem('authToken', data.token);
                        window.location.replace("./client.html");
                    } else {
                        // fires validity popup on input field
                        emailInput.setCustomValidity(data.error | data.message);
                        emailInput.reportValidity();
                    }
                });
        }


    })
})