#!/bin/bash

# Script for automating synchronization of master and some branch in git repository, with respect to Uchi.ru git workflow.
# Script colors git commands and error messages for easy spotting.
#
# Script commands order:
# 1) Store current branch name
# 2) Switch to master
# 3) Pull with rebase from origin
# 4) Checkout branch with name from 1)
# 5) Rebase master into branch
# 6) Checkout master
# 7) Merge branch into master
# *) Notify user that he can push changes
#
# Possible errors are: git is on master branch or git commands errors. You'll be notified.
#
# alexch, uchi.ru

# commands highlight
function col {
  tput dim
  tput setab 7
  tput setaf 4
}
# error colors
function err {
  tput bold
  tput setaf 1
}
# last message colors
function bold {
  tput bold
  tput setaf 5
}
# reset colors
function res {
  tput sgr0
}

# exit if on master
function checkBranch {
  if [[ "$1" = "master" ]]; then
    echo "You're on master branch. Please use $(col)git checkout$(res) to switch to branch what you want to merge."
    exit
  fi
}

# exit if error happened in git command
function checkStatus {
  if [[ $? -ne 0 ]]; then
    echo "$(err)Some error happened. See output above.$(res)"
    exit
  fi
}

BRANCHNAME=$(git rev-parse --abbrev-ref HEAD)
checkStatus
checkBranch $BRANCHNAME

echo "$(col)git checkout master$(res)"
git checkout master
checkStatus

echo "$(col)git pull -r$(res)"
git pull -r
checkStatus

echo "$(col)git checkout $BRANCHNAME$(res)"
git checkout $BRANCHNAME
checkStatus

echo "$(col)git rebase master$(res)"
git rebase master
checkStatus

echo "$(col)git checkout master$(res)"
git checkout master
checkStatus

echo "$(col)git merge $BRANCHNAME$(res)"
git merge $BRANCHNAME
checkStatus

echo ""
echo "Successfully merged."
echo "You are on master branch now. Do $(col)git push origin$(res) by yourself,"
echo "after checking that the current git state is one what you want."
echo ""
