import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';
import { Item } from '../src/domain/Item.js';

describe('CarrinhoBuilder', () => {

    test('deve criar um carrinho com valores padrão', () => {

        // Arrange
        const builder = new CarrinhoBuilder();

        // Act
        const carrinho = builder.build();

        // Assert
        expect(carrinho.user.tipo).toBe('PADRAO');
        expect(carrinho.itens).toHaveLength(1);
        expect(carrinho.calcularTotal()).toBe(100);
    });

    test('deve criar um carrinho vazio', () => {

        // Arrange e Act
        const carrinho = new CarrinhoBuilder()
            .vazio()
            .build();

        // Assert
        expect(carrinho.itens).toHaveLength(0);
        expect(carrinho.calcularTotal()).toBe(0);
    });

    test('deve permitir personalizar usuário e itens', () => {

        // Arrange
        const usuario = UserMother.umUsuarioPremium();

        const itens = [
            new Item('Notebook', 200),
            new Item('Mouse', 50)
        ];

        // Act
        const carrinho = new CarrinhoBuilder()
            .comUser(usuario)
            .comItens(itens)
            .build();

        // Assert
        expect(carrinho.user.tipo).toBe('PREMIUM');
        expect(carrinho.itens).toHaveLength(2);
        expect(carrinho.calcularTotal()).toBe(250);
    });

});
