#!/bin/bash
# Usage: rename-chunk OLDID NEWID
# Script for renaming all files in current directory, with names are exact as OLDID (extension excluded),
# to names as NEWID, and replacing all matches "OLDID" in these files to "NEWID" ones.
# alexch

# exit if arguments number is less than 2 or arguments are equal
function checkArgs {
  if [[ -z "$1" || -z "$2" || "$1" = "$2" ]]; then
    echo "Please provide two distinct arguments."
    exit
  fi
}

checkArgs $1 $2
IDOLD=$1
IDNEW=$2
for oldname in $PWD/$IDOLD.*
do
  if [[ -f $oldname ]]; then
    newname=${oldname/$IDOLD/$IDNEW}
    cp $oldname $newname
    rm $oldname
    sed -i "s/$IDOLD/$IDNEW/g" $newname
    printf "%-15s %3s %-15s\n" $(basename $oldname) "-->" $(basename $newname)
  else
    echo "No files to rename / edit."
    exit
  fi
done
echo "Done."
