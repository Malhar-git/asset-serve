@echo off
:: Start in the root (for Git commands)
wt.exe -d . ; ^

:: Split a new pane horizontally and go to the backend
split-pane -H -d "backend/monetary" ; ^

:: Split the first pane vertically and go to the frontend
split-pane -V -d "frontend"