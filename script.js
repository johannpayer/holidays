let context;
let particles;
let nearestHoliday;
let holidayIndex;

let mouseX;
let mouseY;
let forceRender = true;

function updateCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.globalAlpha = 0.76;
}

function updateParticles() {
  let doRender = forceRender;
  if (forceRender) {
    forceRender = false;
  }

  if (!doRender) {
    if (document.hasFocus()) {
      particles.forEach((particle) => {
        const xDiff = particle.x * canvas.width - mouseX;
        const yDiff = particle.y * canvas.height - mouseY;
        const distance = Math.sqrt((xDiff ** 2) + (yDiff ** 2));
  
        if (distance < 150) {
          const multiple = 10 / (Math.PI * (particle.size ** 2));
          particle.xVel += xDiff * multiple;
          particle.yVel += yDiff * multiple;
  
          doRender = true;
        }
      });
    }

    if (!doRender) {
      doRender = particles.some((particle) => [ 'x', 'y' ].some((x) => Math.abs(particle[x + 'Vel']) >= 0.01));
    }
  }

  if (doRender) {
    function getBoundValue(num) {
      return Math.max(Math.min(num, 1), 0);
    }

    particles.forEach((particle) => {
      if (particle.sizeScale !== 1) {
        particle.sizeScale = Math.min(particle.sizeScale * 1.14, 1);
      }

      [ [ 'x', canvas.width ], [ 'y', canvas.height ] ].forEach(([ propName, dimension ]) => {
        const velPropName = propName + 'Vel';
        particle[propName] += particle[velPropName] / dimension;

        particle[velPropName] *= 0.94;

        const value = particle[propName];
        if (value < 0 || value > 1) {
          particle[propName] = getBoundValue(value);
          particle[velPropName] *= -1;
        }
      });
    });

    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((x) => {
      context.fillStyle = x.color;
      context.beginPath();
      context.arc(x.x * canvas.width, x.y * canvas.height, x.size * x.sizeScale, 2 * Math.PI, false);
      context.fill();
    });
  }

  requestAnimationFrame(updateParticles);
}

function updateText() {
  countdown.innerHTML = `${nearestHoliday.name}<br>${dayjs().to(nearestHoliday.date)}`;
}

function updateNearestHoliday(index) {
  const year = (new Date()).getFullYear();
  const now = Date.now();

  function addDateProp(x) {
    let date = dayjs([ year, x.month, x.dateFunc ? x.dateFunc(year) : x.day ]);
    if (date.valueOf() < now) {
      date = date.set('year', year + 1);
    }

    return { ...x, date };
  }

  nearestHoliday = index === null ? holidays.map(addDateProp).sort((x1, x2) => x1.date.valueOf() - x2.date.valueOf())[0] : addDateProp(holidays[index]);
  holidayIndex = index ?? holidays.findIndex((x) => x.name === nearestHoliday.name);
}

function reset() {
  function getRandomDirection() {
    return (Math.random() * 2) - 1;
  }

  function getRandomCoordinate() {
    return 0.5 + (getRandomDirection()) * 0.1;
  }

  function getRandomVelocity() {
    return getRandomDirection() * 3;
  }

  particles = [];
  for (let i = 0; i < 3000; i++) {
    const { colors } = nearestHoliday;
    particles.push({
      x : getRandomCoordinate(),
      y : getRandomCoordinate(),
      xVel : getRandomVelocity(),
      yVel : getRandomVelocity(),
      size : 1 / (1 + (Math.E ** (getRandomDirection() * 3))) * 6 + 2,
      sizeScale : 0.5,
      color : '#' + colors[Math.floor(colors.length * Math.random())],
    });
  }

  updateText();
  forceRender = true;
}

window.addEventListener('load', () => {
  dayjs.extend(dayjs_plugin_relativeTime);

  const seperator = '?holiday=';
  const param = decodeURI(window.location.href).split('&').find((x) => x.includes(seperator));
  let index = null;
  if (param) {
    const temp = holidays.findIndex((x) => x.name === param.split(seperator)[1]);
    if (temp !== -1) {
      index = temp;
    }
  }

  updateNearestHoliday(index);
  updateText();

  context = canvas.getContext('2d');
  updateCanvasSize();

  reset();
  requestAnimationFrame(updateParticles);
  setInterval(() => {
    if (nearestHoliday.date.valueOf() < Date.now()) {
      updateNearestHoliday(null);
      reset();
    }

    updateText();
  }, 1000);
});

window.addEventListener('resize', () => {
  updateCanvasSize();
  reset();
});

document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener('keydown', (event) => {
  function wrapIndex(index, length) {
    return ((index % length) + length) % length;
  }

  const { key } = event;
  let change;
  if (key === 'ArrowLeft') {
    change = -1;
  } else if (key === 'ArrowRight') {
    change = 1;
  }

  if (change) {
    updateNearestHoliday(wrapIndex(holidayIndex + change, holidays.length));
    reset();
  }
});
