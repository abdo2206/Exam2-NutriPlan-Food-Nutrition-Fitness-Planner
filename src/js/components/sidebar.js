export class SidebarController {
    sidebar = document.getElementById("sidebar");
    sidebarOverlay = document.getElementById("sidebar-overlay");
    menuBtn = document.getElementById("header-menu-btn");
    closeBtn = document.getElementById("sidebar-close-btn");
    init() {
        this.menuBtn?.addEventListener("click", () => {
            const isOpen = this.menuBtn?.getAttribute("aria-expanded") === "true";
            this.setOpen(!isOpen);
        });
        this.closeBtn?.addEventListener("click", () => this.close());
        this.sidebarOverlay?.addEventListener("click", () => this.close());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape")
                this.close();
        });
        window.addEventListener("resize", () => {
            if (!window.matchMedia("(max-width: 1024px)").matches) {
                this.close();
            }
        });
    }
    setOpen(open) {
        if (!this.sidebar || !this.sidebarOverlay || !this.menuBtn)
            return;
        const isMobile = window.matchMedia("(max-width: 1024px)").matches;
        const shouldOpen = open && isMobile;
        this.sidebar.classList.toggle("open", shouldOpen);
        this.sidebarOverlay.classList.toggle("active", shouldOpen);
        document.body.classList.toggle("mobile-sidebar-open", shouldOpen);
        this.menuBtn.setAttribute("aria-expanded", String(shouldOpen));
        this.menuBtn.setAttribute("aria-label", shouldOpen ? "Close navigation menu" : "Open navigation menu");
    }
    close() {
        this.setOpen(false);
    }
}
