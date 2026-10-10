let five = [
  {
    name: "Visor/Main",
    namespace: "9ojp",
    script: 'beş.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Supervisor/"
  },
  {
    name: "Guards",
    namespace: "9ojp",
    script: 'beş.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Shields"
  },
  {
    name: "Room",
    namespace: "9ojp",
    script: 'beş.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Rooms"
  },
  {
    name: "Welcome",
    namespace: "9ojp",
    script: 'beş.js',
    watch: false,
    exec_mode: "cluster",
    max_memory_restart: "2G",
    cwd: "./Welcome"
  },
]
module.exports = {apps: five}
