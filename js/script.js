/**
 * Olympian Anuj International Trust
 * Premium NGO Homepage JavaScript
 * ================================================
 * Handles all interactive functionality including:
 * - Sticky header
 * - Mobile navigation
 * - Smooth scrolling
 * - Counter animations
 * - Testimonial slider
 * - Progress bar animations
 * - Back to top button
 * - Scroll reveal animations
 */

(function() {
    'use strict';

    // =============================================
    // DOM ELEMENTS
    // =============================================
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const backToTop = document.getElementById('backToTop');
    const testimonialTrack = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sliderDots = document.getElementById('sliderDots');
    const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');
    const progressBars = document.querySelectorAll('.progress-fill');
    const statNumbers = document.querySelectorAll('.stat-number');

    // =============================================
    // STATE VARIABLES
    // =============================================
    let currentSlide = 0;
    let isAnimatingStats = false;
    let isAnimatingProgress = false;

    // =============================================
    // INITIALIZATION
    // =============================================
    function init() {
        // Setup event listeners
        setupScrollEvents();
        setupMobileMenu();
        setupDropdowns();
        setupTestimonialSlider();
        setupSmoothScroll();
        setupBackToTop();
        setupScrollReveal();
        
        // Initialize animations on page load
        checkVisibility();
    }

    // =============================================
    // STICKY HEADER
    // =============================================
    function setupScrollEvents() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add scrolled class for shadow effect
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
            
            // Check for animations on scroll
            checkVisibility();
        }, { passive: true });
    }

    // =============================================
    // MOBILE NAVIGATION
    // =============================================
    function setupMobileMenu() {
        if (!mobileToggle || !navMenu) return;
        
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }

    // =============================================
    // DROPDOWN MENUS (Mobile)
    // =============================================
    function setupDropdowns() {
        dropdownItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            
            link.addEventListener('click', function(e) {
                // Only for mobile view
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    item.classList.toggle('dropdown-open');
                }
            });
        });
    }

    // =============================================
    // TESTIMONIAL SLIDER
    // =============================================
    function setupTestimonialSlider() {
        if (!testimonialTrack) return;
        
        const slides = testimonialTrack.querySelectorAll('.testimonial-card');
        const totalSlides = slides.length;
        const dots = sliderDots ? sliderDots.querySelectorAll('.dot') : [];
        
        // Auto slide every 5 seconds
        let autoSlide = setInterval(nextSlide, 5000);
        
        function goToSlide(index) {
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;
            
            currentSlide = index;
            testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
        
        function nextSlide() {
            goToSlide(currentSlide + 1);
        }
        
        function prevSlide() {
            goToSlide(currentSlide - 1);
        }
        
        // Event listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                nextSlide();
                resetAutoSlide();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                prevSlide();
                resetAutoSlide();
            });
        }
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                goToSlide(index);
                resetAutoSlide();
            });
        });
        
        function resetAutoSlide() {
            clearInterval(autoSlide);
            autoSlide = setInterval(nextSlide, 5000);
        }
        
        // Touch support for slider
        let touchStartX = 0;
        let touchEndX = 0;
        
        testimonialTrack.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        testimonialTrack.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
                resetAutoSlide();
            }
        }
    }

    // =============================================
    // SMOOTH SCROLLING
    // =============================================
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    const headerOffset = header.offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // =============================================
    // BACK TO TOP BUTTON
    // =============================================
    function setupBackToTop() {
        if (!backToTop) return;
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, { passive: true });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =============================================
    // COUNTER ANIMATION
    // =============================================
    function animateCounters() {
        if (isAnimatingStats) return;
        
        statNumbers.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000; // 2 seconds
            const startTime = performance.now();
            
            function updateCounter(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.floor(target * easeOutQuart);
                
                // Format number with commas
                counter.textContent = formatNumber(currentValue);
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = formatNumber(target);
                }
            }
            
            requestAnimationFrame(updateCounter);
        });
        
        isAnimatingStats = true;
    }
    
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 100000) {
            return (num / 100000).toFixed(1) + 'L';
        } else if (num >= 1000) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return num.toString();
    }

    // =============================================
    // PROGRESS BAR ANIMATION
    // =============================================
    function animateProgressBars() {
        if (isAnimatingProgress) return;
        
        progressBars.forEach(bar => {
            const progress = bar.getAttribute('data-progress');
            bar.style.width = progress + '%';
        });
        
        isAnimatingProgress = true;
    }

    // =============================================
    // SCROLL REVEAL ANIMATIONS
    // =============================================
    function setupScrollReveal() {
        // Add reveal class to elements
        const revealElements = document.querySelectorAll(
            '.feature-card, .cause-card, .event-card, .blog-card, .about-content, .about-image'
        );
        
        revealElements.forEach(el => {
            el.classList.add('reveal');
        });
    }
    
    function checkVisibility() {
        // Check statistics section
        const statsSection = document.querySelector('.statistics');
        if (statsSection && isInViewport(statsSection) && !isAnimatingStats) {
            animateCounters();
        }
        
        // Check causes section for progress bars
        const causesSection = document.querySelector('.causes');
        if (causesSection && isInViewport(causesSection) && !isAnimatingProgress) {
            animateProgressBars();
        }
        
        // Check reveal elements
        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => {
            if (isInViewport(el, 100)) {
                el.classList.add('active');
            }
        });
    }
    
    function isInViewport(element, offset = 0) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight - offset || document.documentElement.clientHeight - offset) &&
            rect.bottom >= 0
        );
    }

    // =============================================
    // PARALLAX EFFECT FOR HERO
    // =============================================
    function setupParallax() {
        const heroBg = document.querySelector('.hero-bg');
        
        if (heroBg) {
            window.addEventListener('scroll', function() {
                const scrolled = window.pageYOffset;
                const rate = scrolled * 0.3;
                heroBg.style.transform = `translateY(${rate}px)`;
            }, { passive: true });
        }
    }

    // =============================================
    // FORM VALIDATION (Newsletter)
    // =============================================
    function setupFormValidation() {
        const newsletterForm = document.querySelector('.newsletter-form');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const emailInput = this.querySelector('input[type="email"]');
                const email = emailInput.value.trim();
                
                if (validateEmail(email)) {
                    // Show success message
                    showNotification('Thank you for subscribing!', 'success');
                    emailInput.value = '';
                } else {
                    showNotification('Please enter a valid email address.', 'error');
                }
            });
        }
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background-color: ${type === 'success' ? '#0f3d2e' : '#e74c3c'};
            color: white;
            border-radius: 50px;
            font-size: 0.9375rem;
            font-weight: 500;
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // =============================================
    // PRELOADER (Optional)
    // =============================================
    function hidePreloader() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 500);
        }
    }

    // =============================================
    // KEYBOARD NAVIGATION
    // =============================================
    function setupKeyboardNav() {
        document.addEventListener('keydown', function(e) {
            // ESC key closes mobile menu
            if (e.key === 'Escape') {
                if (navMenu && navMenu.classList.contains('active')) {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    }

    // =============================================
    // INTERSECTION OBSERVER FOR PERFORMANCE
    // =============================================
    function setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            // Stats observer
            const statsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isAnimatingStats) {
                        animateCounters();
                    }
                });
            }, { threshold: 0.3 });
            
            const statsSection = document.querySelector('.statistics');
            if (statsSection) statsObserver.observe(statsSection);
            
            // Progress bars observer
            const progressObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isAnimatingProgress) {
                        animateProgressBars();
                    }
                });
            }, { threshold: 0.3 });
            
            const causesSection = document.querySelector('.causes');
            if (causesSection) progressObserver.observe(causesSection);
            
            // Reveal elements observer
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
            
            document.querySelectorAll('.reveal').forEach(el => {
                revealObserver.observe(el);
            });
        }
    }

    // =============================================
    // INITIALIZE EVERYTHING
    // =============================================
    document.addEventListener('DOMContentLoaded', function() {
        init();
        setupFormValidation();
        setupKeyboardNav();
        setupIntersectionObserver();
        hidePreloader();
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Reset mobile menu on resize
            if (window.innerWidth > 992 && navMenu) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Reset dropdowns
                dropdownItems.forEach(item => {
                    item.classList.remove('dropdown-open');
                });
            }
        }, 250);
    });

})();
