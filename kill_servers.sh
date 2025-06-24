#!/bin/sh
lsof -ti:5173 -sTCP:LISTEN | xargs kill
lsof -ti:1029 -sTCP:LISTEN | xargs kill