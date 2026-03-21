// test-setup.js
const express = require("express");

const setupApp = (router, sessionUser = null) => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Mock session and flash
  app.use((req, res, next) => {
    req.session = { destroy: jest.fn((cb) => cb && cb()) };
    if (sessionUser) req.session.user = sessionUser;
    req.flash = jest.fn();

    // Mock render to send JSON for easy assertion
    res.render = jest.fn((view, options) => {
      res.status(200).json({ view, options });
    });
    next();
  });

  app.use("/", router);
  return app;
};

module.exports = setupApp;
