#!/bin/sh

echo "Clearing out dir"
rm -rf out

echo "Building app..."
yarn -s && yarn build

echo "Packaging..."
mkdir out

(cd dist && zip -r "$OLDPWD/out/package.zip" .)

# Temp directory to extract the relevant source files
mkdir out/source

rsync -av --exclude=node_modules --exclude=.git --exclude=out --exclude=dist . out/source

(cd out/source && zip -r "$OLDPWD/out/source.zip" .)

# Clean up temp source dir
rm -rf out/source

echo "\n"
echo "Packaging complete:"
echo "* Upload out/package.zip to the TwitchDev console."
echo "* When asked for source code, send out/source.zip. It contains necessary files to build the project without you having to send node_modules, the entire git history, etc."