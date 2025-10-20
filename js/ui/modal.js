export const Modal = {
  open(html, {primaryText="OK", onPrimary=null}={}){
    const root = document.getElementById("modalRoot");
    const body = document.getElementById("modalBody");
    const primary = document.getElementById("modalPrimary");
    const closeBtn = document.getElementById("modalClose");
    body.innerHTML = html; primary.textContent = primaryText; root.classList.add("open");
    const close = ()=> root.classList.remove("open");
    closeBtn.onclick = close;
    primary.onclick = async ()=>{ if(onPrimary){ await onPrimary(close); } else { close(); } };
  }
};
