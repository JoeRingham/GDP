$(function() {

  var errorMessageNumber = 0,
    errorMessageParent = $("#messages .alert-danger");
  function addError(text){
    var li = $(document.createElement("li"));

    li.html(text);
    li.appendTo(errorMessageParent.children("ul"));

    errorMessageNumber++;
    if(errorMessageNumber > 0){
      errorMessageParent.fadeIn();
    }

    window.setTimeout(function(){
      errorMessageNumber--;
      if(errorMessageNumber < 1){
        errorMessageParent.fadeOut(function(){
          li.remove();
        });
      }else{
        li.remove();
      }
    }, 5000);
  }



  var successMessageNumber = 0,
    successMessageParent = $("#messages .alert-success");
  function addSuccess(text){
    var li = $(document.createElement("li"));

    li.html(text);
    li.appendTo(successMessageParent.children("ul"));

    successMessageNumber++;
    if(successMessageNumber > 0){
      successMessageParent.fadeIn();
    }

    window.setTimeout(function(){
      successMessageNumber--;
      if(successMessageNumber < 1){
        successMessageParent.fadeOut(function(){
          li.remove();
        });
      }else{
        li.fadeOut(function(){
          li.remove();
        });
      }
    }, 5000);
  }

  if(!window.utils){
    window.utils = {};
  }
  window.utils.addSuccess = addSuccess;
  window.utils.addError = addError;



  function login(username, password, cb){
    comms.authenticate(username, password, function(data){
      if(data.authenticated){
        addSuccess("Login Successful");
        
        comms.loadScriptFile("/assets/js/hub/hub.js", function(){
          // Remove the login stuff
          $("#main-content-area").empty();
          $("body").removeClass("login");

          document.title = "The hub";
          
          hub.load(cb);
        });
      }else{
        addError("Invalid username or password");
        if(cb){
          cb({ err : "Invalid username or password" });
        }
      }
    });
  }


  // Functions for changing the view
  function loadSignup(){
    $.get("/views/signup.html", function(data){
      $('body').removeClass("index login").addClass("signup");
      $("#main-content-area").html(data);
      document.title = "Sign up for the hub";

      //Populating the conditions list for selection!
      comms.get_conditions_list(function(conditions){
        var elements = conditions.map(function(cond){
          return $(document.createElement("option")).attr("value", cond.id).html(cond.name);
        });

        $("#signup_conditions").append(elements);
        $("#signup_username").focus();
      });
    });
  }

  function loadLogin() {
    $.get("/views/login.html", function(data){
      $('body').removeClass("index signup").addClass("login");
      $("#main-content-area").html(data);
      document.title = "Log in";

      $("#login_username").focus();
    });
  }

  $(document).on('click', '.signup-btn', loadSignup);
  $(document).on('click', '.login-btn', loadLogin);


  // Non-ideal fix, but does prevent multiple being launched.
  // May cause issues if/when we include a logout button.
  var active = false;

  function login_submit(){
    if(!active)
    {
      active = true;
      // Get the values
      var username = $("#login_username").val(),
      password = $("#login_password").val();

      login(username, password, function(a){
        // Reset as the hub was not launched
        if(a && a.err){
          active = false;
        }
      });
    }
  }

  // Login submission button
  $(document).on('click', '.login-submit', login_submit);

  $(document).on('keypress', "#login_username, #login_password", function(e){
    if(e.keyCode === 13){
      login_submit();
    }
  });



  // Signup scripts!
  function signup_validateUsername(username, cb){
      comms.validate_username(username, function(data){
        cb(data.valid);
      });
  }

  function signup_validatePassword(password, cb){
    cb(password.length >= 6);
  }

  function signup_comparePasswords(password1, password2, cb){
    cb(password1 === password2);
  }

  function signup_validateDob(dob, cb){
    cb(dob < new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10)));
  }


  $(document).on('keyup', '#signup_username', function (event) {
    // Send data to the server to check if it is valid
    var v = $(event.currentTarget).val();
    signup_validateUsername(v, function(valid){
      if(valid){
        $(".signup_username-error").addClass("hidden");
        $(".signup_username-ok").removeClass("hidden");
      }else{
        $(".signup_username-ok").addClass("hidden");
        $(".signup_username-error").removeClass("hidden");
      }
    });
  });

  $(document).on('keyup', '#signup_password', function (event){
    var v = $(event.currentTarget).val();
    signup_validatePassword(v, function(valid){
      if(valid){
          $(".signup_password-error").addClass("hidden");
          $(".signup_password-ok").removeClass("hidden");
        }else{
          $(".signup_password-ok").addClass("hidden");
          $(".signup_password-error").removeClass("hidden");
        }
      });
  });

  $(document).on('keyup', '#signup_repeatPassword', function (event){
    var v = $(event.currentTarget).val(),
      v2 = $("#signup_password").val();

    signup_comparePasswords(v, v2, function(valid){
      if(valid){
          $(".signup_repeatPassword-error").addClass("hidden");
          $(".signup_repeatPassword-ok").removeClass("hidden");
        }else{
          $(".signup_repeatPassword-ok").addClass("hidden");
          $(".signup_repeatPassword-error").removeClass("hidden");
        }
      });
  });

  $(document).on('change', '#signup_dob', function (event){
    var v = new Date($(event.currentTarget).val());

    signup_validateDob(v, function(valid){
      if(valid){
          $(".signup_dob-error").addClass("hidden");
          $(".signup_dob-ok").removeClass("hidden");
        }else{
          $(".signup_dob-ok").addClass("hidden");
          $(".signup_dob-error").removeClass("hidden");
        }
      });
  });



  $(document).on('click', '.signup-submit', function (){
    var username = $("#signup_username").val(),
      password = $("#signup_password").val(),
      repeatPassword = $("#signup_repeatPassword").val(),
      dob = new Date($("#signup_dob").val()),

      //Converting condition ids from strings to ints
      conditions = ($("#signup_conditions").val() || []).map(function(c){
        return parseInt(c);
      });

    signup_validateUsername(username, function(valid){
      if(!valid){
        addError("Username not valid");
        return;
      }
      signup_validatePassword(password, function(valid){
        if(!valid){
          addError("Password not valid");
          return;
        }
        signup_comparePasswords(password, repeatPassword, function(valid){
          if(!valid){
            addError("Passwords do not match");
            return;
          }
          signup_validateDob(dob, function(valid){
            if(!valid){
              addError("Invalid date of birth");
              return;
            }

            comms.sign_up(username, password, dob, conditions, function(data){
              if(data.error){
                addFail("Sign up failed");
              }else{
                addSuccess("Sign up successful");
                // Login and immediately load avatar creation
                login(username, password, function(){
                  hub.launchAvatarCreation();
                });
              }
            });

          });
        });
      });
    });
  });


});

