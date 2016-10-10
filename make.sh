#! /bin/bash
# Build script for all versions
function usage() {
    OUT="\nSimple utility to build the plugin\n\n"
    OUT+="Usage: ${BASH_SOURCE[0]} [version_number] [firefox_max_version]\n\n"
    OUT+="version_number \t\tplugin version\n"
    OUT+="firefox_max_version \tfirefox max for plugin\n"
    echo -e $OUT;
    exit 
}
# It should require a version and a max Firefox version
[ 2 -gt $# ] && usage
VERSION="$1"
MAX_FIREFOX_VERSION="$2"

# It should handle path
ROOT_PATH=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
BUILD_PATH="$ROOT_PATH/build"
OLD_PATH=$(pwd)
TMP_PATH="/tmp/skiptco"

# It should clean the paths
rm -rf "$BUILD_PATH"
rm -rf "$TMP_PATH"

# It should create the necessary paths
[ ! -d "$BUILD_PATH" ] && mkdir "$BUILD_PATH"
[ ! -d "$TMP_PATH" ] && mkdir "$TMP_PATH"

# It should copy the source folders to TEMP
for src in chrome firefox greasemonkey; do cp -r $src "$TMP_PATH"; done

# It should replace the version_variables
for file in $(find "$TMP_PATH" -iregex '.*\.\(js\|json\|rdf\)');do
    sed -i "s/%VERSION%/$VERSION/" "$file"
    sed -i "s/%MAX_FIREFOX_VERSION%/$MAX_FIREFOX_VERSION/" "$file"
done

# It should build firefox
cd "$TMP_PATH/firefox"
zip -r "$BUILD_PATH/skiptco-firefox.xpi" ./*

# It should build chrome
cd "$TMP_PATH/chrome"
zip -r "$BUILD_PATH/skiptco-chrome.zip" ./*

# It should build greasemonkey
cp "$TMP_PATH/greasemonkey/skiptco.js" "$BUILD_PATH/skiptco-greasemonkey.js"

# Back to where we were
cd "$OLD_PATH"
