let context;
let contextColorIndex;
let canvasWidth;
let canvasHeight;
let particles;
let particleSizeScale;

let nearestHoliday;
let holidayIndex;

let mouseX;
let mouseY;
let doForceRender = true;

let lastMousePosition;
let isHoldingRightMouseButton = false;

function updateParticles() {
  let doRender = doForceRender;
  if (doForceRender) {
    doForceRender = false;
  }

  if (document.hasFocus() && lastMousePosition) {
    const mouseSpeed = Math.min(Math.sqrt(((mouseX - lastMousePosition.x) / canvasWidth) ** 2 + ((mouseY - lastMousePosition.y) / canvasHeight) ** 2), 0.02);
    if (isHoldingRightMouseButton || mouseSpeed) {
      const distanceThreshold = isHoldingRightMouseButton ? 300 : 150;

      particles.forEach((particle) => {
        const xDiff = particle.x * canvasWidth - mouseX;
        const yDiff = particle.y * canvasHeight - mouseY;
        const distance = Math.sqrt((xDiff ** 2) + (yDiff ** 2));
        if (distance < distanceThreshold) {
          let multiplier = (isHoldingRightMouseButton ? -0.0002 : 50 / (Math.PI * (particle.size ** 2)) * mouseSpeed) * (distanceThreshold - distance);
          if (isHoldingRightMouseButton) {
            const speed = Math.sqrt((xDiff * multiplier) ** 2 + (yDiff * multiplier) ** 2);
            const minSpeed = 2;
            if (speed < minSpeed) {
              multiplier *= minSpeed / speed;
            }
          }
  
          particle.xVel += xDiff * multiplier;
          particle.yVel += yDiff * multiplier;
  
          doRender = true;
        }
      });
    }
  }

  if (!doRender) {
    doRender = particles.some((particle) => [ 'x', 'y' ].some((dimension) => Math.abs(particle[`${dimension}Vel`]) >= 0.01));
  }

  function isWithinBounds(coordiante) {
    return coordiante >= 0 && coordiante <= 1;
  }

  function getBoundValue(num) {
    return Math.max(Math.min(num, 1), 0);
  }

  if (doRender) {
    if (particleSizeScale !== 1) {
      particleSizeScale = Math.min(particleSizeScale * 1.14, 1);
    }
    
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach((particle) => {
      if (contextColorIndex !== particle.colorIndex) {
        context.fillStyle = `#${nearestHoliday.colors[particle.colorIndex]}`;
        contextColorIndex = particle.colorIndex;
      }

      // I know this is awfully verbose, but it has to be done to improve performance
      particle.x += particle.xVel / canvasWidth;
      particle.y += particle.yVel / canvasHeight;

      if (!isWithinBounds(particle.x)) {
        particle.x = getBoundValue(particle.x);
        particle.xVel *= -1;
      }

      if (!isWithinBounds(particle.y)) {
        particle.y = getBoundValue(particle.y);
        particle.yVel *= -1;
      }

      const decelerationMultiplier = 0.94;
      particle.xVel *= decelerationMultiplier;
      particle.yVel *= decelerationMultiplier;
      
      context.beginPath();
      context.arc(particle.x * canvasWidth, particle.y * canvasHeight, particle.size * particleSizeScale, Math.PI * 2, false);
      context.fill();
    });
  }

  lastMousePosition = { x : mouseX, y : mouseY };
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

function updateCanvasSize() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.globalAlpha = 0.76;
}

function reset() {
  contextColorIndex = null;

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
    particles.push({
      x : getRandomCoordinate(),
      y : getRandomCoordinate(),
      xVel : getRandomVelocity(),
      yVel : getRandomVelocity(),
      size : 1 / (1 + (Math.E ** (getRandomDirection() * 3))) * 6 + 2,
      colorIndex : Math.floor(nearestHoliday.colors.length * Math.random()),
    });
  }

  particleSizeScale = 0.5;

  updateText();
  doForceRender = true;
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

function isRightMouseButton(event) {
  return event.button === 2;
}

document.addEventListener('mousedown', (event) => {
  if (isRightMouseButton(event)) {
    isHoldingRightMouseButton = true;
  }
});

document.addEventListener('mouseup', (event) => {
  if (isRightMouseButton(event)) {
    isHoldingRightMouseButton = false;
  }
});

document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

document.addEventListener('contextmenu', event => event.preventDefault());

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

window.addEventListener('blur', () => { lastMousePosition = null; });
