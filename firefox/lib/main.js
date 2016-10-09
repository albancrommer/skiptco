var pageMod = require( "sdk/page-mod" ),
	self = require("sdk/self");

pageMod.PageMod( {
	include: "*.twitter.com",
	contentScriptFile: self.data.url( "skiptco.js" )
} );
