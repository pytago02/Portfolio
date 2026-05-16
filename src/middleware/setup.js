/**
 * Cấu hình các middleware toàn cục cho Express app.
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');

const { ALLOWED_ORIGIN, PUBLIC_DIR } = require('../config');

function applyMiddleware(app) {
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cors({
    origin:         ALLOWED_ORIGIN,
    methods:        ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(PUBLIC_DIR));
}

module.exports = { applyMiddleware };
