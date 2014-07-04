package = "MADcolors"
version = "scm-0"

source = {
   url = "git://github.com/LAEH/MADcolors",
   branch = "master"
}

description = {
   summary = "MADcolors",
   detailed = [[
A package to manipulate colors.
   ]],
   homepage = "https://github.com/LAEH/MADcolors",
   license = "BSD"
}

dependencies = {
}

build = {
   type = "builtin",
   modules = {
      ['MADcolors.init'] = 'init.lua',
      ['MADcolors.palettes'] = 'palettes.lua',
   }
}
