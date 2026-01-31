#!/usr/bin/env sh
if [ -z "${HUSKY}" ]; then
  export HUSKY=1
fi

if [ "${HUSKY}" = "0" ]; then
  exit 0
fi
