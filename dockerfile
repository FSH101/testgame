FROM php:7.4-apache
RUN a2enmod rewrite headers
COPY . /var/www/html/
RUN sed -ri 's#DocumentRoot /var/www/html#DocumentRoot /var/www/html/public#' /etc/apache2/sites-available/000-default.conf \
 && printf "<Directory /var/www/html/public/>\n  AllowOverride All\n  Require all granted\n</Directory>\n" > /etc/apache2/conf-available/public.conf \
 && a2enconf public \
 && printf "DirectoryIndex index.php index.html\n" > /etc/apache2/conf-available/dirindex.conf \
 && a2enconf dirindex
EXPOSE 80
CMD ["apache2-foreground"]
