// ---------------------------------------------------------------------------------

var express = require("express");
var router = express.Router();
var userHelper = require("../helpers/user-helper");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { error } = require("console");

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

const verifyLogin = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

/* Home Page - get */

router.get("/", (req, res) => {
    res.render("index/index", {
        title: "LIDRS",
        user: req.session.user,
    });
});

/* Signup Page - post */

router.post("/signup", (req, res) => {
    // console.log(req.body);
    // console.log(req.headers.host);
    userHelper.validate(req.body).then((validation) => {
        // console.log(validation);
        if (!validation.status) {
            req.session.flash = {
                error: true,
                type: "danger",
                title: "",
                message: validation.message,
            };
            res.json({ reload: true });
        } else {
            let userData = {
                name: req.body.name.toLowerCase(),
                mobile: req.body.mob,
                email: req.body.email,
                password: req.body.pass,
                question: req.body.ques,
                answer: req.body.ans,
                verified: false,
                status: "pending",
                image: false,
                orginDate: new Date().getTime(),
            };
            userHelper.doSignup(userData, req.headers.host).then((response) => {
                // console.log(response);
                if (response.status) {
                    // req.session.loggedIn = true;
                    req.session.user = response.user;
                    req.session.flash = {
                        type: "success",
                        title: "Mail Sent",
                        message:
                            "Verifiction mail sent to your mail, kindly verify using the mail.",
                    };
                } else {
                    req.session.flash = {
                        type: "info",
                        title: "Error",
                        message: "Some Error occured, try after sometimes.",
                    };
                }
                res.json(response);
            });
        }
    });
});

/* Login Page  */

router.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/profile");
    } else {
        res.render("index/login", {
            title: "Be a Member Now",
        });
    }
});
router.post("/login", (req, res) => {
    // console.log(req.body);
    userHelper.doLogin(req.body).then((response) => {
        // console.log(response);
        if (response.status) {
            req.session.loggedIn = true;
            req.session.user = response.user;
            res.redirect("/profile");
        } else {
            req.session.loginErr = true;
            res.redirect("/login");
        }
    });
});

/* Logout - get */

router.get("/logout", (req, res) => {
    // req.session.destroy((err) => {
    //   if (!err) res.redirect("/login");
    //   else console.log(err);
    // });
    req.session.user = null;
    if (!req.session.user) {
        res.redirect("/login");
    } else res.redirect("/");
});

/* Profile Page and Related */

router.get("/profile", verifyLogin, (req, res) => {
    // console.log(req.session.user);
    userHelper.userData(req.session.user._id).then((response) => {
        // console.log(response);

        res.render("index/profile", {
            title: "Profile",
            user: response,
        });
    });
});
router.get("/change-password", verifyLogin, (req, res) => {
    res.render("index/change_password", {
        title: "Change Password",
    });
});
router.get("/verify-account", (req, res) => {
    // console.log(req.query.token);
    userHelper.verifyAccount(req.query.token).then((response) => {
        // console.log(response);
        if (response.status) {
            req.session.flash = {
                type: "success",
                title: "Account Verified",
                message: "Successfully verified, Please login",
            };
            res.redirect("/profile");
        } else {
            req.session.flash = {
                type: "info",
                title: "Error",
                message: "Some Error occured, try after sometimes.",
            };
            res.redirect("/");
        }
    });
});
router.get("/verify-profile", verifyLogin, (req, res) => {
    // console.log(req.session.user);
    userHelper
        .verifyProfile(req.session.user._id, req.headers.host)
        .then((response) => {
            // console.log(response);
            if (response.sentMail) {
                req.session.flash = {
                    type: "success",
                    title: "Mail Sent",
                    message:
                        "Verifiction mail sent to your mail, kindly verify using the mail.",
                };
            } else {
                req.session.flash = {
                    type: "info",
                    title: "Error",
                    message: "Some Error occured, try after sometimes.",
                };
            }
            res.json(response);
        });
});
router.post("/edit-profile", verifyLogin, (req, res) => {
    // console.log(req.body, req.session.user)
    userHelper.editProfile(req.session.user._id, req.body).then((response) => {
        if (response.status) {
            req.session.flash = {
                type: "success",
                message: response.message,
            };
        } else {
            req.session.flash = {
                type: "danger",
                message: response.message,
            };
        }
        res.redirect("/profile");
    });
});
router.post("/change-password", verifyLogin, (req, res) => {
    // console.log(req.body);
    if (req.body.newPass !== req.body.rePass) {
        req.session.flash = {
            type: "danger",
            message: "Password didn't match.",
        };
        res.redirect("/change-password");
    } else {
        userHelper
            .editPassword(req.session.user._id, req.body.pass, req.body.newPass)
            .then((response) => {
                console.log(response);
                if (response.status) {
                    req.session.flash = {
                        type: "success",
                        message: response.message,
                    };
                    res.redirect("/profile");
                } else {
                    req.session.flash = {
                        type: "info",
                        message: response.message,
                    };
                    res.redirect("/change-password");
                }
            });
    }
});
router.post("/change-question", verifyLogin, (req, res) => {
    // console.log(req.body);
    if (req.body.ques === "") {
        req.session.flash = {
            type: "danger",
            message: "All fields must be filled.",
        };
        res.redirect("/change-password");
    } else {
        userHelper
            .editQuestion(req.session.user._id, req.body)
            .then((response) => {
                // console.log(response);
                if (response.status) {
                    req.session.flash = {
                        type: "success",
                        message: response.message,
                    };
                    res.redirect("/profile");
                } else {
                    req.session.flash = {
                        type: "info",
                        message: response.message,
                    };
                    res.redirect("/change-password");
                }
            });
    }
});

router.post("/edit-image/:id", (req, res) => {
    // fs.stat(
    //   "public/images/user-images/" + req.params.id + ".jpg",
    //   async (err, stat) => {
    //     // console.log(err, stat);
    //     if (err === null) {
    //       fs.unlink(
    //         "./public/images/user-images/" + req.params.id + ".jpg",
    //         (err) => {
    //           if (err) console.log(err);
    //         }
    //       );
    //     }
    //   }
    // );

    let image = req.files.image;
    image.mv("public/images/user-images/" + req.params.id + ".jpg");
    userHelper.editImage(req.params.id).then(() => {});

    // .then(async () => {
    // await imageHelper.resizeImage(req.params.id).then((response) => {
    //   // console.log(response);
    //   if (response.status) {
    //   } else {
    //   }
    // });
    // });

    res.redirect("/profile");
});

router.get("/remove-image/:id", (req, res) => {
    userHelper.removeImage(req.params.id).then(() => {
        res.redirect("/profile");
        fs.unlink(
            "./public/images/user-images/" + req.params.id + ".jpg",
            (err) => {
                if (err) console.log(err);
            }
        );
    });
});

/* Contact Page */

router.get("/contact-us", (req, res) => {
    res.render("index/contact_us", {
        title: "Contact Us",
    });
});
router.post("/contact-form", (req, res) => {
    // console.log(req.body);
    userHelper.sentContactMail(req.body).then((response) => {
        // console.log(response);
        if (response.status) {
            req.session.flash = {
                type: "success",
                message: response.message,
            };
        } else {
            req.session.flash = {
                type: "info",
                message: response.message,
            };
        }
        res.json(response);
    });
});

/* Forget Password Page */

router.get("/forget-password", (req, res) => {
    res.render("index/forget_password", {
        title: "Reset Password",
    });
});
router.post("/forget-password", (req, res) => {
    // console.log(req.body);
    if (req.body.ques) {
        userHelper.resetPassword(req.body).then((response) => {
            // console.log(response);
            if (!response.status) {
                req.session.flash = {
                    type: "danger",
                    message: response.message,
                };
                // res.redirect("/forget-password");
            }
            res.json(response);
        });
    }
});
router.post("/reset-password", (req, res) => {
    // console.log(req.body);
    userHelper.sentPassword(req.body).then((response) => {
        // console.log(response);
        if (response.status) {
            req.session.flash = {
                type: "success",
                message: response.message,
            };
        } else {
            req.session.flash = {
                type: "info",
                message: response.message,
            };
        }
        res.json(response);
    });
});

/* Terms and Conditions Page - get */

router.get("/terms", (req, res) => {
    res.render("index/terms", {
        title: "Terms and Conditions",
    });
});
router.get("/policy", (req, res) => {
    res.render("index/policy", {
        title: "Privacy Policy",
    });
});

/* Search Page */

router.get("/search", (req, res) => {
    // console.log(req.query);
    userHelper.search(req.query).then((response) => {
        // console.log(response.emp);
        res.render("index/search", {
            title: "Search Result",
            results: response,
            // status: response.status,
            // result: response.result,
            // user: response.emp,
        });
    });
});
router.get("/increment-count", (req, res) => {
    userHelper.incrementCount().then((data) => {
        console.log(data);
    });
});

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

// router.get("/password",  (req, res)=> {
//   res.render("index/password", {
//     title: "Password Reset !",
//     password: tempPassword,
//   });
// });

router.post("/questions", (req, res) => {
    let question = req.body.question;
    let regex = /\d{4}\/\d{4}/;
    let id = question.match(regex);
    if (id.length > 0) {
        userHelper.getDoc(id[0]).then((data) => {
            const py = spawn("python", [
                "public/python_scripts/questionAnswering.py",
                `${question}`,
                `${data.text}`,
            ]);

            py.stdout.on("data", (data) => {
                console.log(data.toString().replace(/\s+/g, " ").trim());
                res.json({
                    question: question,
                    answer: data.toString().replace(/\s+/g, " ").trim(),
                });
            });
            py.stderr.on("data", (data) => {
                console.error(data.toString());
            });

            py.on("close", (code) => {
                console.log(`child process end with ${code}`);
            });
        });
    } else {
        res.json({
            question: question,
            answer: "Insufficient Data",
        });
    }
});

router.post("/question", (req, res) => {
    let question = req.body.question;
    let regex = /\d{4}\/\d{4}/;
    let id = question.match(regex);
    if (id) {
        userHelper.getDoc(id[0]).then((data) => {
            const py = spawn("python", [
                "public/python_scripts/questionAnswering.py",
                `${req.body.question}`,
                `${data.text}`,
            ]);

            py.stdout.on("data", (data) => {
                console.log(data.toString().replace(/\s+/g, " ").trim());
                res.render("index/answer", {
                    answer: data.toString(),
                    question: question,
                    title: "Answer",
                });
            });
            py.stderr.on("data", (data) => {
                console.error(data.toString());
            });

            py.on("close", (code) => {
                console.log(`child process end with ${code}`);
            });
        });
    } else {
        res.render("index/answer", {
            answer: "Insuficient Data",
            question: question,
            title: "Answer",
        });
    }
});

router.post("/document", (req, res) => {
    if (!req.files || !req.files.doc) {
        req.session.flash = {
            type: "error",
            message: "No PDF file uploaded",
        };
        return res.redirect("/");
    }

    const pdfFile = req.files.doc;
    let response = {};
    pdfFile.mv(path.join("public/documents/", pdfFile.name), (err) => {
        if (err) {
            console.error(err);
            req.session.flash = {
                type: "error",
                message: "Something Went Wrong",
            };
            return res.redirect("/");
        }

        const py = spawn("python", [
            "public/python_scripts/convertPdfToText.py",
            `public/documents/${pdfFile.name}`,
        ]);

        py.stdout.on("data", (data) => {
            console.log(data.toString().replace(/\s+/g, " ").trim());
            // fs.appendFile(
            //   "public/documents/db.txt",
            //   `${data.toString().replace(/\s+/g, " ").trim()}\n`,
            //   (err) => {
            //     if (err) {
            //       console.err;
            //       return;
            //     }
            //   }
            // );
            let text = data.toString().replace(/\s+/g, " ").trim();
            let regex = /\d{4}\/\d{4}/;
            let id = text.match(regex)[0];
            userHelper.saveDoc(text, id).then((resp) => {
                response = resp;
                // fs.rename(
                //   `public/documents/${pdfFile.name}`,
                //   `public/documents/${id}.png`,
                //   function (err) {
                //     if (err) throw err;
                //     console.log("File renamed successfully!");
                //   }
                // );
                if (!response.status) {
                    req.session.flash = {
                        type: "info",
                        title: "Error",
                        message: "Document with same deed number exist",
                    };
                } else {
                    req.session.flash = {
                        type: "Success",
                        title: "Success",
                        message: "File uploaded successfully",
                    };
                }
                res.redirect("/");
            });
        });
        py.stderr.on("data", (data) => {
            console.error(data.toString());
        });

        py.on("close", (code) => {
            console.log(`child process end with ${code}`);
        });

        console.log("File upload completed");
    });
});

// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------

module.exports = router;
