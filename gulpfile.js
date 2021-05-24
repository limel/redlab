// Определяем переменную "preprocessor"
let preprocessor = 'scss';

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync
const browserSync = require('browser-sync').create();

// Подключаем gulp-concat
const concat = require('gulp-concat');

// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-sass
const scss = require('gulp-scss');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем gulp-imagemin для работы с изображениями
const imagemin = require('gulp-imagemin');

// Подключаем модуль gulp-newer
const newer = require('gulp-newer');

// Подключаем include для html
const fileInclude = require('gulp-file-include');

// Подключаем Sourcemaps
const sourcemaps = require('gulp-sourcemaps');

// Подключаем модуль del
const del = require('del');

// Подключаем gulp-uncss
const uncss = require('gulp-uncss');

// ППодключаем gulp-plumber для отслеживания ошибок
const plumber = require('gulp-plumber');

// для отслеживания размеров картинок
const size = require('gulp-size');

const rename = require('gulp-rename');
// Определяем логику работы Browsersync
function browsersync() {
	browserSync.init({
		// Инициализация Browsersync
		server: { baseDir: 'dist/' }, // Указываем папку сервера
	});
}

function scripts() {
	return src([
		// Берём файлы из источников
		//'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		'app/js/jquery.min.js',
		'app/js/lazyload.js',
		'app/js/owl.carousel.min.js',
		'app/js/app.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
	])
		.pipe(concat('app.min.js')) // Конкатенируем в один файл
		.pipe(uglify()) // Сжимаем JavaScript
		.pipe(dest('dist/js/')) // Выгружаем готовый файл в папку назначения
		.pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
}

function styles() {
	return (
		src('app/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
			.pipe(plumber())
			.pipe(sourcemaps.init())
			.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
			.pipe(concat('main.min.css')) // Конкатенируем в файл main.min.css
			.pipe(
				autoprefixer({
					overrideBrowserslist: ['last 10 versions'],
					grid: true,
				}),
			) // Создадим префиксы с помощью Autoprefixer
			// .pipe(
			//   uncss({
			//     html: ['app/*.html'],
			//     ignore: [/\.owl-*/],
			//   }),
			// )
			// убираем стили которые не используються
			.pipe(
				cleancss({
					level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
				}),
			) // Минифицируем стили
			.pipe(sourcemaps.write(''))
			.pipe(dest('dist/css/')) // Выгрузим результат в папку "app/css/"
			.pipe(browserSync.stream())
	); // Сделаем инъекцию в браузер
}

// обрабатываем html проекта
function fileinclude() {
	return src(['app/**/*.html', 'app/*.html'])
		.pipe(
			fileInclude({
				prefix: '@@',
				basepath: '@file',
			}),
		)
		.pipe(dest('dist/'))
		.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
		.on('change', browserSync.reload);
}

// копируем шрифты
function copyfonts() {
	return src([
		'app/fonts/*.eot',
		'app/fonts/*.ttf',
		'app/fonts/*.woff',
		'app/fonts/*.woff2',
		'app/fonts/*.css',
	])
		.pipe(dest('dist/fonts'))
		.pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
}

const imageMinConfig = {
	mozjpeg: { quality: 75, progressive: true },
	optipng: { optimizationLevel: 5 },
	svgo: {
		plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
	},
};

function images() {
	return src([
		'app/img/*.png',
		'app/img/*.jpg',
		'app/img/*.svg',
		'app/img/**/*.jpg',
		'app/img/**/*.png',
		'app/img/**/*.svg',
		'!app/img/favicon/*.png',
		'!app/img/favicon/',
	]) // Берём все изображения из папки источника
		.pipe(newer('dist/img')) // Проверяем, было ли изменено (сжато) изображение ранее
		.pipe(
			imagemin([
				imagemin.mozjpeg(imageMinConfig.mozjpeg),
				imagemin.optipng(imageMinConfig.optipng),
				imagemin.svgo(imageMinConfig.svgo),
			]),
		)
		.pipe(rename({ dirname: '' }))
		.pipe(size({ showFiles: true }))
		.pipe(dest('dist/img'));
}

function cleanimg() {
	return del('dist/img/**/*', { force: true }); // Удаляем всё содержимое папки "app/images/dest/"
}

function buildcopy() {
	return src(
		[
			// Выбираем нужные файлы
			'app/css/**/*.min.css',
			'app/js/**/*.min.js',
			'app/images/dest/**/*',
			'app/**/*.html',
		],
		{ base: 'app' },
	) // Параметр "base" сохраняет структуру проекта при копировании
		.pipe(dest('dist')); // Выгружаем в папку с финальной сборкой
}

function cleandist() {
	return del('dist/**/*', { force: true }); // Удаляем всё содержимое папки "dist/"
}

function startwatch() {
	// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);

	// Мониторим файлы препроцессора на изменения
	watch('app/**/' + preprocessor + '/**/*', styles);

	// Мониторим файлы HTML на изменения
	watch('app/**/*.html').on('change', browserSync.reload);

	// Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch('app/img/src/**/*', images);

	// Мониторим файлы HTML на изменения
	watch(['app/**/*.html', 'app/*.html'], fileinclude);
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Экспортируем функцию styles() в таск styles
exports.styles = styles;

// Экспортируем функцию fileinclude() в таск fileinclude
exports.fileinclude = fileinclude;

// Экспортируем функцию copyfonts() в таск copyfonts
exports.copyfonts = copyfonts;

// Экспорт функции images() в таск images
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(
	cleandist,
	styles,
	fileinclude,
	scripts,
	copyfonts,
	images,
	buildcopy,
);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(
	styles,
	fileinclude,
	scripts,
	copyfonts,
	images,
	browsersync,
	startwatch,
);
