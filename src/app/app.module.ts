import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { HomeComponent } from './home/home.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserFormComponent } from './user-form/user-form.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { VerifyAccountComponent } from './verify-account/verify-account.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { UserService } from './user.service';
import { AdminGuard } from './admin.guard';
import { HistoriqueComponent } from './historique/historique.component';
import { ProfileComponent } from './profile/profile.component';
import { LivraisonComponent } from './livraison/livraison.component';
import { MapsComponent } from './maps/maps.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { HomeclientComponent } from './homeclient/homeclient.component';
import { NotificationComponent } from './notification/notification.component';
import { ProductListClientComponent } from './product-list-client/product-list-client.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductPromotionViewComponent } from './product-promotion-view/product-promotion-view.component';
import { ProduitCreateComponent } from './produit-create/produit-create.component';
import { ProduitDetailsClientComponent } from './produit-details-client/produit-details-client.component';
import { ProduitDetailsComponent } from './produit-details/produit-details.component';
import { ProduitExpirationListComponent } from './produit-expiration-list/produit-expiration-list.component';
import { ProduitParCategorieClientComponent } from './produit-par-categorie-client/produit-par-categorie-client.component';
import { ProduitParCategorieComponent } from './produit-par-categorie/produit-par-categorie.component';
import { PromotionAddComponent } from './promotion-add/promotion-add.component';
import { PromotionAnalyticsComponent } from './promotion-analytics/promotion-analytics.component';
import { PromotionFormComponent } from './promotion-form/promotion-form.component';
import { PromotionListComponent } from './promotion-list/promotion-list.component';
import { PromotionMenuComponent } from './promotion-menu/promotion-menu.component';
import { StockPurchaseDashboardComponent } from './stock-purchase-dashboard/stock-purchase-dashboard.component';
import { MatDialogModule } from '@angular/material/dialog';
import { PromotionsRoutingModule } from './promotion-routing.module';
import { NgChartsModule } from 'ng2-charts';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommandeComponent } from './commande/commande.component';
import { WishlistComponent } from './wishlist/wishlist.component'; // ✅ Ajout
import { ToastrModule } from 'ngx-toastr';
import { PaymentComponent } from './payment/payment.component';
import { FactureComponent } from './facture/facture.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    InscriptionComponent,
    HomeComponent,
    UserListComponent,
    UserEditComponent,
    UserFormComponent,
    UserProfileComponent,
    VerifyAccountComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    MyAccountComponent,
    HistoriqueComponent,
    ProfileComponent,
    LivraisonComponent,
    MapsComponent,
    ProduitCreateComponent,
    ProductListComponent,
    HomeclientComponent,
    ProduitDetailsComponent,
    ProduitParCategorieComponent,
    NotificationComponent,
    ProductListClientComponent,
    ProduitParCategorieClientComponent,
    ProduitDetailsClientComponent,
    
    ProduitExpirationListComponent,
    PromotionAddComponent,
    PromotionAnalyticsComponent,
    PromotionFormComponent,
    PromotionListComponent,
    PromotionMenuComponent,
    CommandeComponent,
    WishlistComponent,
    PaymentComponent,
    FactureComponent,
   
    StockPurchaseDashboardComponent,
        ProductPromotionViewComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    PromotionsRoutingModule,
    MatDialogModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgChartsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })


  ],
  providers: [UserService, AdminGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
