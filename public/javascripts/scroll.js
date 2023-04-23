var waypoint = new Waypoint({
    element: document.getElementById('map'),
    handler: function(direction) {
      if (direction === 'down') {
        // Add a class to your navbar to change its color
        document.getElementById('navbar').classList.add('scrolled');
      } else {
        // Remove the class to reset the color
        document.getElementById('navbar').classList.remove('scrolled');
      }
    },
    offset:'-50%'
  });