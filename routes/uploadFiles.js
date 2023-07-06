const express = require("express");
const router = express.Router();

const request = require("request");
const xlsx = require("xlsx-populate");
const schedule = require("node-schedule");
const ftp = require('ftp');


// configuracion básica para conectarse al servidor ftp
const configFTP = {
  host: "192.168.1.25", // direccion ip de servidor ftp local
  user: "aarteaga@gbm.net", // en este caso como es local, el usuario es el de windows
  password: "", // clave de usuario de windows
  port: 21, // depende del puerto que hayamos colocado en la creacion del servidor ftp local
};


// endpoints de prueba para llenar los datos de los archivos excel
const apis = [
  'https://jsonplaceholder.typicode.com/todos',
  'https://jsonplaceholder.typicode.com/users',
  'https://jsonplaceholder.typicode.com/posts',
  'https://jsonplaceholder.typicode.com/albums',
  'https://jsonplaceholder.typicode.com/comments',
  'https://jsonplaceholder.typicode.com/photos',
]

// al ingresar la ruta por defecto
router.get("/", (req, response) => {
  scheduleUpload('*/30 * * * * *');
});

function createExcel(data, fileName) {
  // Crear un nuevo libro de Excel
  return xlsx.fromBlankAsync().then((workbook) => {
    const sheet = workbook.sheet(0);

    // Obtener los nombres de las propiedades del primer objeto
    const properties = Object.keys(data[0]);

    properties.forEach((property, index) => {
      sheet.cell(1, index + 1).value(property);
    });

    // Escribir los datos de los objetos en el arreglo
    data.forEach((obj, rowIndex) => {
      properties.forEach((property, colIndex) => {
        sheet.cell(rowIndex + 2, colIndex + 1).value(obj[property]);
      });
    });

    // Guardar el libro como archivo Excel
    return workbook.toFileAsync(fileName);
  });
}

function scheduleUpload(scheduleFormat) {
  // se crea la tarea con el formato de programacion (cada cuantos minutos, dias, horas, semanas, etc) que viene del parametro
  const job = schedule.scheduleJob(scheduleFormat, async () => {

    // se obtiene el dia, mes, año y el tiempo que sera el nombre del archivo excel
    const date = new Date();
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const month =
      date.getMonth() + 1 < 10
        ? `0${date.getMonth() + 1}`
        : date.getMonth() + 1;
    const time = date.valueOf();

    // nombre del archivo
    const fileName = `Datos_${day}-${month}-${date.getFullYear()}-${time}.xlsx`;

    // se realiza la peticion http al endpoint de manera aleatoria del arreglo de endpoints declarado arriba
    request(apis[Math.floor(Math.random() * 6)], { json: true }, (err, res, body) => {
      if (err) return console.log(err);

        // si se realiza la peticion correctamente, se crea el archivo excel con la respuesta (body) y se guarda en la carpeta uploads
        createExcel(body, `./uploads/${fileName}`).then(() => {
          // cuando se termine de crear el archivo, se sube al servidor ftp (local path, remote path, nombre del archivo)
          uploadToFTP(`./uploads/${fileName}`, `./${fileName}`, fileName);
        });
      }
    );

  });
}


function uploadToFTP(localPath, remotePath, fileName) {
  // Crea una nueva instancia de cliente FTP
  const client = new ftp();

  // Conecta con el servidor FTP
  client.connect(configFTP);

  // Manejadores de eventos para la conexión FTP
  client.on('ready', () => {

    console.log('FTP ready');

    // Subir el archivo al servidor FTP
    client.put(localPath, remotePath, (err) => {
      if (err) return console.log(err);
      console.log(`${fileName}, subido correctamente`);
      client.end();
    });
  });



}

module.exports = router;
